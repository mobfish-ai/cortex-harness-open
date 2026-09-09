// Host-only DSH Web command surface for the CORTEX task pool.
// The browser sends only a slash command to DSH. CORTEX credentials stay in
// this host process and are never returned to the command result.

import { randomUUID } from "node:crypto";

const DEFAULT_BASE_URL = "http://127.0.0.1:8787";
const TOKEN_ENV = "CORTEX_API_TOKEN";
const BASE_URL_ENV = "CORTEX_API_BASE_URL";
const TASK_ID_PATTERN = /^[A-Za-z0-9._:-]{1,192}$/u;
const MAX_INPUT_LENGTH = 4096;

function loopbackUrl(value) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol) || !['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
    throw new Error("CORTEX_API_BASE_URL must point to localhost");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/u, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function errorText(body, fallback) {
  if (body && typeof body === "object" && body.error && typeof body.error.message === "string") return body.error.message;
  return fallback;
}

function parseInput(rawInput) {
  const raw = rawInput.trim();
  if (raw.length === 0) return { kind: "status" };
  if (raw.length > MAX_INPUT_LENGTH) return { kind: "invalid", text: "Usage: /cortex [status|recover|enqueue <task_id> <manifest> [1|3|5]]" };
  const parts = raw.split(/\s+/u);
  if (parts[0] === "status" && parts.length === 1) return { kind: "status" };
  if (parts[0] === "recover" && parts.length === 1) return { kind: "recover" };
  if (parts[0] === "enqueue" && parts.length === 4) {
    const [, taskId, manifest, maxActiveText] = parts;
    if (!TASK_ID_PATTERN.test(taskId) || manifest.length === 0 || manifest.startsWith("/") || manifest.split("/").includes("..")) {
      return { kind: "invalid", text: "task_id and manifest must be safe local identifiers" };
    }
    const maxActive = Number(maxActiveText);
    if (![1, 3, 5].includes(maxActive)) return { kind: "invalid", text: "max_active_cards must be 1, 3, or 5" };
    return { kind: "enqueue", taskId, manifest, maxActive };
  }
  return { kind: "invalid", text: "Usage: /cortex [status|recover|enqueue <task_id> <manifest> [1|3|5]]" };
}

function summarizeStatus(body) {
  const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const counts = tasks.reduce((result, task) => {
    const status = typeof task?.status === "string" ? task.status : "UNKNOWN";
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {});
  return `CORTEX task pool: ${tasks.length} task(s); ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(", ") || "no tasks"}.`;
}

function summarizeEnqueue(body) {
  const task = body?.task;
  return `CORTEX queued ${typeof task?.task_id === "string" ? task.task_id : "the task"} (${typeof task?.status === "string" ? task.status : "QUEUED"}).`;
}

function summarizeRecover(body) {
  const taskIds = Array.isArray(body?.task_ids) ? body.task_ids.filter((value) => typeof value === "string") : [];
  return `CORTEX recovery examined ${taskIds.length} task(s).`;
}

export function createCortexApiClient(options = {}) {
  const baseUrl = loopbackUrl(options.baseUrl ?? process.env[BASE_URL_ENV] ?? DEFAULT_BASE_URL);
  const tokenEnv = options.tokenEnv ?? TOKEN_ENV;
  const fetchImpl = options.fetchImpl ?? fetch;
  return async function call(operation, payload) {
    const token = options.token ?? process.env[tokenEnv];
    if (typeof token !== "string" || token.trim() === "") throw new Error(`CORTEX token is missing from ${tokenEnv}`);
    const isStatus = operation === "status";
    const response = await fetchImpl(new URL(`/v1/native-task-pool/${operation}`, baseUrl), {
      method: isStatus ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${token}`,
        ...(isStatus ? {} : { "content-type": "application/json", "idempotency-key": `dsh-cortex-${operation}-${randomUUID()}` }),
      },
      ...(isStatus ? {} : { body: JSON.stringify(payload ?? {}) }),
    });
    let body;
    try { body = await response.json(); } catch { throw new Error(`CORTEX returned non-JSON (${response.status})`); }
    if (!response.ok) throw new Error(errorText(body, `CORTEX rejected ${operation} (${response.status})`));
    return body;
  };
}

export function createCortexCommandDefinition(options = {}) {
  const call = options.call ?? createCortexApiClient(options);
  return {
    name: "cortex",
    description: "inspect and operate the CORTEX task pool",
    input: { hint: "[status|recover|enqueue <task_id> <manifest> [1|3|5]]" },
    handler: async (invocation) => {
      const parsed = parseInput(invocation.rawInput);
      if (parsed.kind === "invalid") return { kind: "error", text: parsed.text };
      try {
        const body = await call(parsed.kind, parsed.kind === "enqueue" ? {
          task_id: parsed.taskId,
          manifest: parsed.manifest,
          max_active_cards: parsed.maxActive,
        } : {});
        if (parsed.kind === "status") return { kind: "success", text: summarizeStatus(body) };
        if (parsed.kind === "enqueue") return { kind: "success", text: summarizeEnqueue(body) };
        return { kind: "success", text: summarizeRecover(body) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "CORTEX command failed";
        const token = options.token ?? process.env[options.tokenEnv ?? TOKEN_ENV];
        return { kind: "error", text: typeof token === "string" && token !== "" ? message.replaceAll(token, "[redacted]") : message };
      }
    },
  };
}

export const name = "cortex-dsh-web-command";
export const inject = ["commands"];

export function apply(ctx) {
  ctx.commands.register(createCortexCommandDefinition());
}
