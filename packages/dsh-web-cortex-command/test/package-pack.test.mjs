import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../", import.meta.url));

test("npm pack dry-run contains only the public command package surface", async () => {
  const cache = await mkdtemp(join(tmpdir(), "cortex-dsh-npm-cache-"));
  try {
    const { stdout } = await execFileAsync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: packageRoot,
      env: {
        ...process.env,
        npm_config_cache: cache,
        npm_config_audit: "false",
        npm_config_fund: "false",
        npm_config_update_notifier: "false",
      },
      maxBuffer: 1024 * 1024,
    });
    const report = JSON.parse(stdout);
    assert.equal(report.length, 1);
    const files = report[0].files.map(entry => entry.path).sort();
    assert.deepEqual(files, [
      "LICENSE",
      "README.md",
      "cordis.patch.yml",
      "index.mjs",
      "package.json",
    ]);
    assert.equal(report[0].private, undefined);
    const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    assert.equal(packageJson.private, undefined);
    assert.deepEqual(packageJson.keywords, ["dsh-plugin", "deepseek-harness"]);
  } finally {
    await rm(cache, { recursive: true, force: true });
  }
});
