# CORTEX DSH Web command

This is a host-only DSH Web plugin. It registers one slash command, `/cortex`,
through DSH's `ctx.commands` service. The browser sends the command text to the
DSH host; the host calls the authenticated CORTEX localhost API. The browser
never receives `CORTEX_API_TOKEN`, and the plugin cannot settle a task or mark
work complete.

The package is public-ready under the name `cortex-dsh-web-command` and is
compatible with the future `cortex-harness-open` export because its package
surface contains no private workspace paths, credentials, or runtime state.
The package is not claimed to be published yet. After a registry release, the
public install form is:

```sh
npm install cortex-dsh-web-command
```

## Install into a local DSH Web profile

From a local checkout, install the package into the DSH `web` profile:

```sh
dsh plugin --profile web add file:/absolute/path/to/cortex-harness/packages/dsh-web-cortex-command
```

Set these variables in the environment of the DSH host process before starting
the Web profile:

```sh
export CORTEX_API_BASE_URL=http://127.0.0.1:8787
export CORTEX_API_TOKEN='same-token-used-by-cortex-task-pool-server'
dsh web
```

The default CORTEX address is `http://127.0.0.1:8787`. The plugin rejects a
non-local address. Do not put the token in `cordis.patch.yml`, browser code, a
URL, or a committed file.

Restart DSH Web after installation. In the chat input, use:

```text
/cortex status
/cortex enqueue <task_id> <manifest> 1
/cortex enqueue <task_id> <manifest> 3
/cortex enqueue <task_id> <manifest> 5
/cortex recover
```

`manifest` is relative to the manifest root configured on the CORTEX server.
The task pool, Kernel, leases, replay, and receipts remain authoritative on the
CORTEX side.

## Profile patch

The package declares the official nested `dsh.bundle.patch` metadata (the JSON
shape is `dsh: { bundle: { patch: "./cordis.patch.yml" } }`). If the
profile needs a manual patch, add this row to the Web profile's patch file:

```yaml
- insert:
    - id: cortex-dsh-web-command
      name: cortex-dsh-web-command
```

Remove the row and run `dsh plugin --profile web remove
cortex-dsh-web-command` to uninstall it. The package has no browser bundle and
does not claim a DSH Web UI panel or a new Typert namespace; the slash command
is the smallest host-side Web entry point.

## Local smoke test

The smoke test starts a mock DSH Web command surface and a mock CORTEX API,
then exercises `status`, `enqueue`, `recover`, malformed input, and missing
token handling:

```sh
bash scripts/runtime-bootstrap.sh node --test packages/dsh-web-cortex-command/test/smoke.test.mjs
```

The first test also checks that the package entry point and declared profile
patch load, and that the patch registers the host command. The mock portion
proves the local command-to-API boundary. This does not prove a real DSH Web
installation, profile loader, or remote DSH Web deployment; those require a
machine with DSH Web installed and a real CORTEX server.

The package smoke also runs `npm pack --dry-run` and checks the exact public
file list. Publishing to a registry or listing this command in a DSH
marketplace is a separate step requiring the real registry account,
credentials, and an independent public read-back.
