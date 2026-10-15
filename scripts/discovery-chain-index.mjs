#!/usr/bin/env node
// Copyright 2026 mobfish-ai
// SPDX-License-Identifier: Apache-2.0
// Discovery-chain index service (cortex.discovery-chain-index/v1).
// Builds a verb -> task -> skill lookup from a directory of `<skill>/SKILL.md`
// files, verifies it by digest, refreshes it atomically, and serves it
// read-only over loopback HTTP. Zero dependencies beyond Node 24.
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, writeSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "cortex.discovery-chain-index/v1";
export const BLOCK_SCHEMA = "cortex.block-seven-elements/v1";
export const SEVEN_ELEMENTS = Object.freeze([
  "method_contract", "implementation", "tests", "evidence", "runtime_adapters", "license", "update_mechanism",
]);

// Secret-shaped text never enters the index; the description is replaced.
const SECRET_SHAPES = [
  /sk-[A-Za-z0-9_-]{16,}/, /AKIA[0-9A-Z]{16}/, /gh[pousr]_[A-Za-z0-9]{20,}/, /xox[abpr]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*\S{8,}/i,
];
export function looksSecret(text) { return SECRET_SHAPES.some((re) => re.test(String(text))); }

export const VERB_GROUPS = Object.freeze([
  ["修复/排障", /\b(fix|debug|diagnos|troubleshoot|repair|error)\w*|修复|排障|故障|报错/i],
  ["部署/运维", /\b(deploy|launchd|systemd|restart|server|ops|monitor)\w*|部署|运维|重启|监控/i],
  ["数据/查询", /\b(query|report|analy[sz]|metric|dashboard|sql|data)\w*|查询|报表|分析|数据/i],
  ["内容/写作", /\b(write|draft|blog|article|seo|copy)\w*|写作|文章|文案|改写/i],
  ["沟通/消息", /\b(email|mail|slack|discord|telegram|message|notify)\w*|邮件|消息|通知/i],
  ["设计/图像", /\b(design|image|diagram|logo|visual)\w*|设计|图像|图片/i],
  ["代码/仓库", /\b(git|github|commit|code|repo|test)\w*|代码|仓库|提交/i],
]);
export const FALLBACK_GROUP = "其它/通用";

export function parseFrontmatter(text) {
  const m = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

export function classify(text) {
  for (const [group, re] of VERB_GROUPS) if (re.test(text)) return group;
  return FALLBACK_GROUP;
}

const sha256 = (buf) => `sha256:${createHash("sha256").update(buf).digest("hex")}`;

export function scanSkills(skillsDir) {
  const root = resolve(skillsDir);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`skills dir not found: ${root}`);
  const entries = [];
  let redacted = 0;
  for (const name of readdirSync(root).sort()) {
    const file = join(root, name, "SKILL.md");
    if (!existsSync(file)) continue;
    const fm = parseFrontmatter(readFileSync(file, "utf8"));
    const skill = fm.name || name;
    let description = (fm.description || "").replace(/\s+/g, " ").slice(0, 280);
    if (looksSecret(description) || looksSecret(skill)) { description = "[redacted: secret-shaped text]"; redacted += 1; }
    entries.push({ skill, path: `${name}/SKILL.md`, group: classify(`${skill} ${description}`), description });
  }
  return { entries, redacted };
}

export function renderMarkdown(entries, generatedAt) {
  const groups = new Map();
  for (const e of entries) { if (!groups.has(e.group)) groups.set(e.group, []); groups.get(e.group).push(e); }
  const lines = ["# 动词任务索引（我要做X → 用什么）", `> schema ${SCHEMA} · generated ${generatedAt} · ${entries.length} skills · 不含任何密钥`, ""];
  for (const [group, list] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${group}（${list.length}）`);
    for (const e of list) lines.push(`- **${e.skill}** — ${e.description.slice(0, 110)}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildIndex({ skillsDir, outDir, version = "0.1.0", now = new Date() }) {
  const { entries, redacted } = scanSkills(skillsDir);
  const generatedAt = now.toISOString();
  const indexJson = JSON.stringify({ schema: SCHEMA, version, generated_at: generatedAt, entries }, null, 2) + "\n";
  const md = renderMarkdown(entries, generatedAt);
  for (const text of [indexJson, md]) {
    // Defense in depth: a redaction miss must fail the build, not ship.
    for (const e of entries) if (looksSecret(e.description)) throw new Error("secret-shaped text reached output");
    if (looksSecret(text)) throw new Error("secret-shaped text reached output");
  }
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  const files = { "index.json": indexJson, "VERB-TASK-INDEX.md": md };
  const digests = {};
  for (const [name, text] of Object.entries(files)) { writeFileSync(join(out, name), text); digests[name] = sha256(text); }
  const manifest = { schema: SCHEMA, version, generated_at: generatedAt, skills: entries.length, redacted, files: digests };
  writeFileSync(join(out, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export function verifyIndex(indexDir) {
  const dir = resolve(indexDir);
  const problems = [];
  let manifest;
  try { manifest = JSON.parse(readFileSync(join(dir, "MANIFEST.json"), "utf8")); } catch { return { ok: false, problems: ["MANIFEST_MISSING_OR_INVALID"] }; }
  if (manifest.schema !== SCHEMA) problems.push("SCHEMA_MISMATCH");
  for (const [name, digest] of Object.entries(manifest.files ?? {})) {
    const p = join(dir, name);
    if (!existsSync(p)) { problems.push(`MISSING:${name}`); continue; }
    if (sha256(readFileSync(p)) !== digest) problems.push(`DIGEST_MISMATCH:${name}`);
  }
  return { ok: problems.length === 0, version: manifest.version, skills: manifest.skills, problems };
}

export function queryIndex(indexDir, terms, limit = 10) {
  const { entries } = JSON.parse(readFileSync(join(resolve(indexDir), "index.json"), "utf8"));
  const words = String(terms).toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return entries
    .map((e) => {
      const hay = `${e.skill} ${e.description} ${e.group}`.toLowerCase();
      const score = words.reduce((s, w) => s + (e.skill.toLowerCase().includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0);
      return { ...e, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

function consultFailure(reason, heartbeat, extra = {}) {
  return {
    ok: false, schema: SCHEMA, phase: "before_start", reason, heartbeat, trees_read: 0, results: [], ...extra,
  };
}

// Consumption side. A task or heartbeat calls this before it starts work.
// It only reads verified discovery trees. It never writes them.
export function consultBeforeStart({ trees, task, heartbeat = null, limit = 10 } = {}) {
  const caller = heartbeat === undefined || heartbeat === null || heartbeat === "" ? null : String(heartbeat);
  if (caller !== null && looksSecret(caller)) return consultFailure("HEARTBEAT_SECRET_SHAPED", null);
  const taskText = String(task ?? "").trim();
  if (!taskText) return consultFailure("TASK_REQUIRED", caller);
  if (looksSecret(taskText)) return consultFailure("TASK_SECRET_SHAPED", caller);
  const list = [...new Set(
    (Array.isArray(trees) ? trees : [trees])
      .filter((tree) => tree !== undefined && tree !== null && String(tree).trim() !== "")
      .map((tree) => resolve(String(tree))),
  )];
  if (list.length === 0) return consultFailure("NO_TREES", caller);
  const cap = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(50, Math.floor(Number(limit))) : 10;
  const problems = [];
  const hits = [];
  for (const tree of list) {
    const verdict = verifyIndex(tree);
    if (!verdict.ok) {
      problems.push({ tree, problems: verdict.problems });
      continue;
    }
    for (const hit of queryIndex(tree, taskText, cap)) {
      hits.push({
        tree, version: verdict.version, skill: hit.skill, path: hit.path,
        group: hit.group, description: hit.description, score: hit.score,
      });
    }
  }
  if (problems.length > 0) return consultFailure("TREE_UNVERIFIED", caller, { problems });
  hits.sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill) || a.tree.localeCompare(b.tree));
  return {
    ok: true, schema: SCHEMA, phase: "before_start", task: taskText, heartbeat: caller,
    trees_read: list.length, results: hits.slice(0, cap),
  };
}

// Update mechanism: stage a candidate built elsewhere, verify it, then swap it
// in atomically. The previous index is kept as `<dir>.prev` for rollback.
export function updateIndex({ fromDir, indexDir }) {
  const candidate = verifyIndex(fromDir);
  if (!candidate.ok) return { updated: false, reason: "CANDIDATE_INVALID", problems: candidate.problems };
  const target = resolve(indexDir);
  const current = existsSync(join(target, "MANIFEST.json")) ? verifyIndex(target) : null;
  const src = JSON.parse(readFileSync(join(resolve(fromDir), "MANIFEST.json"), "utf8"));
  if (current?.ok) {
    const cur = JSON.parse(readFileSync(join(target, "MANIFEST.json"), "utf8"));
    if (JSON.stringify(cur.files) === JSON.stringify(src.files)) return { updated: false, reason: "UP_TO_DATE", version: cur.version };
  }
  const stage = `${target}.stage`;
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  for (const name of ["MANIFEST.json", ...Object.keys(src.files)]) writeFileSync(join(stage, name), readFileSync(join(resolve(fromDir), name)));
  if (!verifyIndex(stage).ok) { rmSync(stage, { recursive: true, force: true }); return { updated: false, reason: "STAGE_INVALID" }; }
  const prev = `${target}.prev`;
  rmSync(prev, { recursive: true, force: true });
  if (existsSync(target)) renameSync(target, prev);
  mkdirSync(dirname(target), { recursive: true });
  renameSync(stage, target);
  return { updated: true, version: src.version, previous: current?.version ?? null, rollback: existsSync(prev) ? prev : null };
}

export function rollbackIndex(indexDir) {
  const target = resolve(indexDir);
  const prev = `${target}.prev`;
  if (!existsSync(prev) || !verifyIndex(prev).ok) return { rolledBack: false, reason: "NO_VALID_PREVIOUS" };
  const bad = `${target}.rejected`;
  rmSync(bad, { recursive: true, force: true });
  if (existsSync(target)) renameSync(target, bad);
  renameSync(prev, target);
  return { rolledBack: true, version: verifyIndex(target).version };
}

// Read-only HTTP surface. Loopback by default; no write routes exist.
export function createIndexServer(indexDir) {
  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(body)); };
    if (req.method !== "GET") return send(405, { error: "read_only" });
    if (url.pathname === "/healthz") { const v = verifyIndex(indexDir); return send(v.ok ? 200 : 503, v); }
    if (url.pathname === "/v1/manifest") return send(200, JSON.parse(readFileSync(join(resolve(indexDir), "MANIFEST.json"), "utf8")));
    if (url.pathname === "/v1/search") return send(200, { results: queryIndex(indexDir, url.searchParams.get("q") ?? "", Number(url.searchParams.get("limit") ?? 10)) });
    return send(404, { error: "not_found" });
  });
}

export function checkSevenElements(blockDir) {
  const dir = resolve(blockDir);
  let block;
  try { block = JSON.parse(readFileSync(join(dir, "block.json"), "utf8")); } catch { return { ok: false, missing: [...SEVEN_ELEMENTS], problems: ["BLOCK_JSON_INVALID"] }; }
  const repoRoot = resolve(dir, block.repo_root ?? "../..");
  const missing = [];
  for (const el of SEVEN_ELEMENTS) {
    const refs = block.elements?.[el];
    if (!Array.isArray(refs) || refs.length === 0 || !refs.every((r) => existsSync(resolve(repoRoot, r)))) missing.push(el);
  }
  return { ok: block.schema === BLOCK_SCHEMA && missing.length === 0, block_id: block.block_id, gate: block.release_gate, missing };
}

function arg(argv, name, fallback) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; }
function collect(argv, name) {
  const out = [];
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === name && i + 1 < argv.length) out.push(argv[i += 1]);
  return out;
}

export async function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  const print = (o) => process.stdout.write(JSON.stringify(o, null, 2) + "\n");
  switch (cmd) {
    case "build": print(buildIndex({ skillsDir: arg(rest, "--skills"), outDir: arg(rest, "--out"), version: arg(rest, "--version", "0.1.0") })); return 0;
    case "verify": { const r = verifyIndex(arg(rest, "--index")); print(r); return r.ok ? 0 : 1; }
    case "query": print(queryIndex(arg(rest, "--index"), arg(rest, "--q", ""), Number(arg(rest, "--limit", "10")))); return 0;
    case "before-start": {
      const r = consultBeforeStart({
        trees: [...collect(rest, "--tree"), ...collect(rest, "--index")],
        task: arg(rest, "--task", ""),
        heartbeat: arg(rest, "--heartbeat", null),
        limit: Number(arg(rest, "--limit", "10")),
      });
      print(r);
      return r.ok ? 0 : 1;
    }
    case "update": { const r = updateIndex({ fromDir: arg(rest, "--from"), indexDir: arg(rest, "--index") }); print(r); return r.updated || r.reason === "UP_TO_DATE" ? 0 : 1; }
    case "rollback": { const r = rollbackIndex(arg(rest, "--index")); print(r); return r.rolledBack ? 0 : 1; }
    case "elements": { const r = checkSevenElements(arg(rest, "--block", "blocks/discovery-chain-index")); print(r); return r.ok ? 0 : 1; }
    case "serve": {
      const port = Number(arg(rest, "--port", "8795"));
      const host = arg(rest, "--host", "127.0.0.1");
      createIndexServer(arg(rest, "--index")).listen(port, host, () => writeSync(1, `listening ${host}:${port}\n`));
      return null;
    }
    default:
      process.stderr.write("usage: discovery-chain-index.mjs build|verify|query|before-start|update|rollback|elements|serve [options]\n");
      return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = await main();
  if (code !== null) process.exitCode = code;
}
