// Copyright 2026 mobfish-ai
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  SEVEN_ELEMENTS, buildIndex, checkSevenElements, classify, consultBeforeStart, createIndexServer, looksSecret,
  parseFrontmatter, queryIndex, rollbackIndex, updateIndex, verifyIndex,
} from "./discovery-chain-index.mjs";

const BLOCK = resolve("blocks/discovery-chain-index");
const SKILLS = join(BLOCK, "fixtures/skills");
const scratch = () => mkdtempSync(join(tmpdir(), "dci-"));

test("frontmatter parsing and verb classification", () => {
  assert.deepEqual(parseFrontmatter("---\nname: a\ndescription: \"b c\"\n---\nbody"), { name: "a", description: "b c" });
  assert.equal(classify("Fix a broken launchd job"), "Fix / Troubleshoot");
  assert.equal(classify("Send a customer email"), "Communication / Messaging");
  assert.equal(classify("nothing in particular"), "Other / General");
});

test("build redacts secret-shaped descriptions and writes digest-bound output", () => {
  const out = scratch();
  try {
    const m = buildIndex({ skillsDir: SKILLS, outDir: out, version: "1.0.0", now: new Date("2026-10-15T00:00:00Z") });
    assert.equal(m.skills, 5);
    assert.equal(m.redacted, 1);
    for (const name of ["index.json", "VERB-TASK-INDEX.md", "MANIFEST.json"]) assert.equal(looksSecret(readFileSync(join(out, name), "utf8")), false);
    const markdown = readFileSync(join(out, "VERB-TASK-INDEX.md"), "utf8");
    assert.match(markdown, /^# Verb task index \(I want to do X → which skill\)/u);
    assert.match(markdown, /contains no secrets/u);
    assert.equal(/[\u3400-\u9fff]/u.test(markdown), false);
    assert.deepEqual(verifyIndex(out), { ok: true, version: "1.0.0", skills: 5, problems: [] });
    writeFileSync(join(out, "index.json"), "{}");
    assert.equal(verifyIndex(out).ok, false);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("query ranks skill-name hits first", () => {
  const out = scratch();
  try {
    buildIndex({ skillsDir: SKILLS, outDir: out });
    const hits = queryIndex(out, "email");
    assert.equal(hits[0].skill, "email-followup");
    assert.deepEqual(queryIndex(out, ""), []);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("update is atomic, idempotent, rejects bad candidates, and rolls back", () => {
  const root = scratch();
  try {
    const live = join(root, "live");
    const v1 = join(root, "v1");
    const v2 = join(root, "v2");
    buildIndex({ skillsDir: SKILLS, outDir: v1, version: "1.0.0", now: new Date("2026-10-15T00:00:00Z") });
    buildIndex({ skillsDir: SKILLS, outDir: v2, version: "1.1.0", now: new Date("2026-10-16T00:00:00Z") });
    assert.equal(updateIndex({ fromDir: v1, indexDir: live }).updated, true);
    assert.equal(updateIndex({ fromDir: v1, indexDir: live }).reason, "UP_TO_DATE");
    const r = updateIndex({ fromDir: v2, indexDir: live });
    assert.equal(r.updated, true);
    assert.equal(r.previous, "1.0.0");
    writeFileSync(join(v1, "VERB-TASK-INDEX.md"), "tampered");
    assert.equal(updateIndex({ fromDir: v1, indexDir: live }).reason, "CANDIDATE_INVALID");
    assert.equal(verifyIndex(live).version, "1.1.0");
    assert.deepEqual(rollbackIndex(live), { rolledBack: true, version: "1.0.0" });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("HTTP surface is read-only", async () => {
  const out = scratch();
  buildIndex({ skillsDir: SKILLS, outDir: out });
  const server = createIndexServer(out);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    const body = await (await fetch(`${base}/v1/search?q=blog`)).json();
    assert.equal(body.results[0].skill, "blog-rewrite");
    assert.equal((await fetch(`${base}/v1/search`, { method: "POST" })).status, 405);
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  } finally {
    await new Promise((r) => server.close(r));
    rmSync(out, { recursive: true, force: true });
  }
});

test("the Block declares all seven elements and every reference exists", () => {
  const r = checkSevenElements(BLOCK);
  assert.deepEqual(r.missing, []);
  assert.equal(r.ok, true);
  assert.equal(SEVEN_ELEMENTS.length, 7);
});

test("before-start reads relevant trees and does not write them", () => {
  const root = scratch();
  try {
    const first = join(root, "a");
    const second = join(root, "b");
    buildIndex({ skillsDir: SKILLS, outDir: first, version: "1.0.0" });
    buildIndex({ skillsDir: SKILLS, outDir: second, version: "1.0.0" });
    const before = readFileSync(join(first, "index.json"), "utf8");
    const hit = consultBeforeStart({ trees: [first, second], task: "email follow up", heartbeat: "hb-9" });
    assert.equal(hit.ok, true);
    assert.equal(hit.phase, "before_start");
    assert.equal(hit.heartbeat, "hb-9");
    assert.equal(hit.trees_read, 2);
    assert.equal(hit.results[0].skill, "email-followup");
    assert.equal(hit.results.filter((row) => row.skill === "email-followup").length, 2);
    assert.equal(readFileSync(join(first, "index.json"), "utf8"), before);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("before-start fails closed and does not echo secret-shaped text", () => {
  const out = scratch();
  try {
    buildIndex({ skillsDir: SKILLS, outDir: out, version: "1.0.0" });
    writeFileSync(join(out, "index.json"), "{}\n");
    const bad = consultBeforeStart({ trees: [out], task: "email follow up", heartbeat: "hb-9" });
    assert.equal(bad.ok, false);
    assert.equal(bad.reason, "TREE_UNVERIFIED");
    assert.deepEqual(bad.results, []);
    assert.equal(consultBeforeStart({ trees: [out], task: "   " }).reason, "TASK_REQUIRED");
    assert.equal(consultBeforeStart({ trees: [], task: "email" }).reason, "NO_TREES");
    const secretTask = consultBeforeStart({ trees: [out], task: "password=xxxxxxxxxxxx", heartbeat: "hb-9" });
    assert.equal(secretTask.reason, "TASK_SECRET_SHAPED");
    assert.equal(JSON.stringify(secretTask).includes("xxxxxxxxxxxx"), false);
    const secretCaller = consultBeforeStart({ trees: [out], task: "email", heartbeat: "token=xxxxxxxxxxxx" });
    assert.equal(secretCaller.reason, "HEARTBEAT_SECRET_SHAPED");
    assert.equal(secretCaller.heartbeat, null);
    assert.equal(JSON.stringify(secretCaller).includes("xxxxxxxxxxxx"), false);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("before-start command is the task and heartbeat read path", () => {
  const out = scratch();
  try {
    buildIndex({ skillsDir: SKILLS, outDir: out, version: "1.0.0" });
    const ok = spawnSync(process.execPath, [
      "scripts/discovery-chain-index.mjs", "before-start",
      "--tree", out, "--task", "email follow up", "--heartbeat", "hb-cli",
    ], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(JSON.parse(ok.stdout).results[0].skill, "email-followup");
    writeFileSync(join(out, "VERB-TASK-INDEX.md"), "tampered\n");
    const bad = spawnSync(process.execPath, [
      "scripts/discovery-chain-index.mjs", "before-start",
      "--index", out, "--task", "email follow up",
    ], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.equal(JSON.parse(bad.stdout).reason, "TREE_UNVERIFIED");
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("block license is Apache-2.0, copyright mobfish-ai, and open", () => {
  const license = readFileSync(join(BLOCK, "LICENSE"), "utf8");
  const notice = readFileSync(join(BLOCK, "NOTICE"), "utf8");
  const block = JSON.parse(readFileSync(join(BLOCK, "block.json"), "utf8"));
  const contract = readFileSync(join(BLOCK, "BLOCK.md"), "utf8");
  assert.match(license, /Apache License/);
  assert.match(license, /Version 2\.0/);
  assert.match(license, /Copyright 2026 mobfish-ai/);
  assert.equal(license.includes("MIT License"), false);
  assert.match(notice, /Copyright 2026 mobfish-ai/);
  assert.equal(notice.includes("not a published package"), false);
  assert.equal(notice.includes("private until a sanitization audit"), false);
  assert.equal(block.license, "Apache-2.0");
  assert.equal(block.copyright, "mobfish-ai");
  assert.equal(block.publish, true);
  assert.equal(block.publication, "open");
  assert.ok(block.elements.license.includes("blocks/discovery-chain-index/LICENSE"));
  assert.ok(block.elements.license.includes("blocks/discovery-chain-index/NOTICE"));
  assert.equal(contract.includes("MIT"), false);
});

test("gate B reproduction bootstraps exact Node 24.16.0 and reads trees before work", () => {
  const script = readFileSync(join(BLOCK, "reproduce-gate-b.sh"), "utf8");
  assert.match(script, /v24\.16\.0/);
  assert.match(script, /before-start/);
  assert.match(script, /git bundle verify/);
  assert.match(script, /DCI_BOOTSTRAP_NODE/);
  assert.match(script, /sha256sum/);
  assert.match(script, /shasum/);
  assert.match(script, /openssl/);
  assert.doesNotMatch(script, /\bpath=/);
});

test("CJK fixtures keep their text and classify to English groups", () => {
  const out = scratch();
  try {
    const skills = join(BLOCK, "fixtures/cjk/skills");
    buildIndex({ skillsDir: skills, outDir: out, version: "1.0.0", now: new Date("2026-10-18T00:00:00Z") });
    const index = JSON.parse(readFileSync(join(out, "index.json"), "utf8"));
    const bySkill = Object.fromEntries(index.entries.map((entry) => [entry.skill, entry]));
    assert.equal(bySkill["fix-cn"].group, "Fix / Troubleshoot");
    assert.equal(bySkill["mail-cn"].group, "Communication / Messaging");
    assert.equal(bySkill["plain-cn"].group, "Other / General");
    assert.match(bySkill["fix-cn"].description, /\p{Script=Han}/u);
    const keywords = JSON.parse(readFileSync(join(BLOCK, "fixtures/cjk-verb-keywords.json"), "utf8"));
    for (const [group, words] of Object.entries(keywords.groups)) {
      assert.equal(classify(words[0]), group, group);
    }
    const markdown = readFileSync(join(out, "VERB-TASK-INDEX.md"), "utf8");
    assert.match(markdown, /^# Verb task index/u);
    assert.match(markdown, /## Fix \/ Troubleshoot/u);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("evidence GATE-B.md has no banned internal host tokens", () => {
  const gateB = readFileSync(join(BLOCK, "evidence/GATE-B.md"), "utf8");
  const banned = [
    /\bsz0[0-9]\b/i,
    /\bmac0[0-9]\b/i,
    /KelvindeMac/i,
    /\/Users\/klong\b/,
    /obsidian\/ob1/,
    /\bfeat\/fp08-discovery-chain-index\b/,
    /\bbackup\/local-p07-20260912\b/,
  ];
  for (const re of banned) {
    assert.equal(re.test(gateB), false, `GATE-B.md must not match ${re}`);
  }
});
