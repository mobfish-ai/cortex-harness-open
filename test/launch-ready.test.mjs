import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "cache"]);
const POLICY_FILES = new Set([
  "ALLOWLIST.md",
  "scripts/check-export-grep.sh",
]);

const forbidden = [
  { name: "home-directory path", re: /\/Users\/[A-Za-z0-9._-]+/u },
  { name: "shopify store host", re: /myshopify\.com/iu },
  { name: "aws access key id", re: /\bAKIA[0-9A-Z]{16}\b/u },
  { name: "github token", re: /\bghp_[A-Za-z0-9]{20,}\b/u },
  { name: "github fine-grained token", re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u },
  { name: "slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/u },
  { name: "private key", re: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/u },
  {
    name: "private IPv4 address",
    re: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/u,
  },
];

async function filesUnder(directory) {
  const found = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await filesUnder(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

test("Apache-2.0 LICENSE, NOTICE, and launch docs are present", async () => {
  const rootLicense = await readFile(join(root, "LICENSE"), "utf8");
  const packageLicense = await readFile(join(root, "packages/dsh-web-cortex-command/LICENSE"), "utf8");
  assert.equal(rootLicense, packageLicense);
  assert.match(rootLicense, /Apache License/u);
  assert.match(rootLicense, /Version 2\.0, January 2004/u);
  assert.equal(rootLicense.includes("MIT License"), false);

  for (const packagePath of ["package.json", "packages/dsh-web-cortex-command/package.json"]) {
    const manifest = JSON.parse(await readFile(join(root, packagePath), "utf8"));
    assert.equal(manifest.license, "Apache-2.0");
  }

  for (const noticePath of ["NOTICE", "packages/dsh-web-cortex-command/NOTICE"]) {
    const notice = await readFile(join(root, noticePath), "utf8");
    assert.match(notice, /Copyright 2026 Cortex Harness contributors/u);
  }

  for (const required of [
    "README.md",
    "ALLOWLIST.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "ROADMAP.md",
    "blocks/README.md",
    "scripts/check-export-grep.sh",
    "wrangler.toml",
    "docs/index.md",
    "docs/zh/index.md",
    "docs/.vitepress/config.mjs",
    ".github/workflows/ci.yml",
  ]) {
    const info = await stat(join(root, required));
    assert.equal(info.isFile(), true, required);
  }

  const readme = await readFile(join(root, "README.md"), "utf8");
  assert.match(readme, /^# Cortex Harness/u);
  assert.match(readme, /discovery-chain-index/u);
  assert.match(readme, /CORTEX Six Laws/u);
  assert.match(readme, /cortexharness\.org/u);
  assert.match(readme, /npm test/u);

  const roadmap = await readFile(join(root, "ROADMAP.md"), "utf8");
  assert.match(roadmap, /cortex-loop/u);
  assert.match(roadmap, /discovery-chain-index/u);

  const ci = await readFile(join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(ci, /npm test/u);
  assert.match(ci, /node-version: 24/u);
  assert.match(ci, /check-export-grep\.sh/u);
  assert.match(ci, /docs:build/u);
  assert.equal(ci.includes("pages deploy"), false);

  const wrangler = await readFile(join(root, "wrangler.toml"), "utf8");
  assert.match(wrangler, /name = "cortexharness-org"/u);
  assert.match(wrangler, /pages_build_output_dir = "\.\/docs\/\.vitepress\/dist"/u);
  assert.match(wrangler, /cortexharness\.ai is reserved/u);
});

test("repository text contains no secret-like or private material", async () => {
  const files = await filesUnder(root);
  const findings = [];
  for (const path of files) {
    const relativePath = relative(root, path);
    const buffer = await readFile(path);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    for (const rule of forbidden) {
      if (POLICY_FILES.has(relativePath) && rule.name === "home-directory path") continue;
      const match = rule.re.exec(text);
      if (match) findings.push(`${relativePath}: ${rule.name}: ${match[0]}`);
    }
  }
  assert.deepEqual(findings, []);
});

test("Chinese appears only in the docs display layer", async () => {
  const cjk = /[\u4e00-\u9fff]/u;
  const files = await filesUnder(root);
  const findings = [];
  for (const path of files) {
    const relativePath = relative(root, path);
    if (relativePath.startsWith("docs/")) continue;
    const buffer = await readFile(path);
    if (buffer.includes(0)) continue;
    if (cjk.test(buffer.toString("utf8"))) findings.push(relativePath);
  }
  assert.deepEqual(findings, []);
});
