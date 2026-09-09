import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test } from "node:test";
import { apply, createCortexCommandDefinition } from "../index.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function bodyOf(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  return text === "" ? {} : JSON.parse(text);
}

test("package entry point and profile patch load the host command", async () => {
  const packageRoot = new URL("../", import.meta.url);
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(typeof packageJson.dsh?.bundle, "object");
  assert.equal(packageJson.dsh.bundle.patch, "./cordis.patch.yml");
  const entry = new URL(packageJson.exports["."], packageRoot);
  const patchPath = new URL(packageJson.dsh.bundle.patch, packageRoot);
  await readFile(entry, "utf8");
  const patch = await readFile(patchPath, "utf8");
  assert.match(patch, /id:\s*cortex-dsh-web-command/u);
  assert.match(patch, /name:\s*cortex-dsh-web-command/u);
  const registrations = [];
  apply({ commands: { register(definition) { registrations.push(definition); } } });
  assert.deepEqual(registrations.map(definition => definition.name), ["cortex"]);
});

test("DSH Web command reaches the authenticated CORTEX API without exposing the token to the browser", async () => {
  const cortexRequests = [];
  const cortex = createServer(async (request, response) => {
    const requestBody = await bodyOf(request);
    cortexRequests.push({ authorization: request.headers.authorization, path: request.url, body: requestBody });
    if (request.headers.authorization !== "Bearer smoke-token") return json(response, 403, { error: { message: "forbidden" } });
    if (request.method === "GET" && request.url === "/v1/native-task-pool/status") {
      return json(response, 200, { schema_version: "cortex.native-task-pool-api/v1", tasks: [{ task_id: "smoke-task", status: "QUEUED" }] });
    }
    if (request.method === "POST" && request.url === "/v1/native-task-pool/enqueue") {
      return json(response, 200, { schema_version: "cortex.native-task-pool-api/v1", task: { task_id: requestBody.task_id, status: "QUEUED" } });
    }
    if (request.method === "POST" && request.url === "/v1/native-task-pool/recover") {
      return json(response, 200, { schema_version: "cortex.native-task-pool-api/v1", task_ids: ["smoke-task"] });
    }
    return json(response, 404, { error: { message: "not found" } });
  });
  const cortexBaseUrl = await listen(cortex);
  const registrations = new Map();
  const dsh = createServer(async (request, response) => {
    const input = await bodyOf(request);
    assert.equal(request.headers.authorization, undefined, "browser-side DSH request must not carry the CORTEX token");
    const line = typeof input.line === "string" ? input.line : "";
    const [name, ...rest] = line.replace(/^\//u, "").split(/\s+/u);
    const command = registrations.get(name);
    if (command === undefined) return json(response, 404, { kind: "error", text: "command not found" });
    const result = await command.handler({ rawInput: rest.join(" "), signal: new AbortController().signal });
    return json(response, 200, result);
  });
  const dshBaseUrl = await listen(dsh);
  const previousToken = process.env.CORTEX_API_TOKEN;
  const previousBaseUrl = process.env.CORTEX_API_BASE_URL;
  process.env.CORTEX_API_TOKEN = "smoke-token";
  process.env.CORTEX_API_BASE_URL = cortexBaseUrl;
  try {
    apply({ commands: { register(definition) { registrations.set(definition.name, definition); } } });
    const run = (line) => fetch(`${dshBaseUrl}/api/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ line }) }).then(response => response.json());
    assert.deepEqual(await run("/cortex status"), { kind: "success", text: "CORTEX task pool: 1 task(s); QUEUED=1." });
    assert.deepEqual(await run("/cortex enqueue smoke-task batch.json 3"), { kind: "success", text: "CORTEX queued smoke-task (QUEUED)." });
    assert.deepEqual(await run("/cortex recover"), { kind: "success", text: "CORTEX recovery examined 1 task(s)." });
    assert.equal(cortexRequests[0].authorization, "Bearer smoke-token");
    assert.deepEqual(cortexRequests.map(request => request.path), [
      "/v1/native-task-pool/status",
      "/v1/native-task-pool/enqueue",
      "/v1/native-task-pool/recover",
    ]);
    assert.equal(cortexRequests[1].body.max_active_cards, 3);
    assert.equal(JSON.stringify(await run("/cortex status")).includes("smoke-token"), false);

    delete process.env.CORTEX_API_TOKEN;
    const missing = await run("/cortex status");
    assert.equal(missing.kind, "error");
    assert.match(missing.text, /CORTEX token is missing/u);
  } finally {
    if (previousToken === undefined) delete process.env.CORTEX_API_TOKEN; else process.env.CORTEX_API_TOKEN = previousToken;
    if (previousBaseUrl === undefined) delete process.env.CORTEX_API_BASE_URL; else process.env.CORTEX_API_BASE_URL = previousBaseUrl;
    await close(dsh);
    await close(cortex);
  }
});

test("CORTEX command rejects non-local API targets and malformed enqueue input", async () => {
  assert.throws(() => createCortexCommandDefinition({ baseUrl: "https://example.com", token: "nope" }), /localhost/u);
  const command = createCortexCommandDefinition({ token: "fixture", call: async () => ({}) });
  const malformed = await command.handler({ rawInput: "enqueue task ../escape 3", signal: new AbortController().signal });
  assert.deepEqual(malformed, { kind: "error", text: "task_id and manifest must be safe local identifiers" });
});
