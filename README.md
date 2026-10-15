# Cortex Harness

Cortex Harness is the open protocol and reference tooling for running CORTEX
work as small Blocks. A Block has its own entrypoint, tests, and public
contract. The CORTEX Kernel remains the authority for leases, replay,
receipts, and completion decisions.

The public constitution is the CORTEX Six Laws, also called the CORTEX
Collaboration Constitution. English is the source language. Chinese is used
only on the docs site's display pages.

This repository holds the Apache-2.0 license, the export allowlist, the
`cortexharness.org` docs, and the directory reviewed Blocks land in.

## Quickstart

Install Node.js 24 or newer. Cloning and testing does not need a CORTEX
server or a DSH install.

```sh
git clone https://github.com/mobfish-ai/cortex-harness-open.git
cd cortex-harness-open
npm test
```

`npm test` runs the Node.js test runner and the export grep gate.

To send live commands, run a CORTEX task-pool server on loopback and install
the adapter into a local DSH Web profile. Keep the token in the host
environment:

```sh
export CORTEX_API_BASE_URL=http://127.0.0.1:8787
export CORTEX_API_TOKEN='token configured on your local task-pool server'
dsh plugin --profile web add "file:$PWD/packages/dsh-web-cortex-command"
dsh web
```

Then, in the chat input:

```text
/cortex status
/cortex enqueue <task_id> <manifest> 1
/cortex enqueue <task_id> <manifest> 3
/cortex enqueue <task_id> <manifest> 5
/cortex recover
```

`CORTEX_API_BASE_URL` must use `127.0.0.1`, `localhost`, or `::1`. The default
is `http://127.0.0.1:8787`. `manifest` is a relative path inside the manifest
root configured on that server. The adapter can inspect, enqueue, and recover.
Settlement and completion stay on the CORTEX side.

The registry name `cortex-dsh-web-command` is reserved for a later npm
release. No registry release is published from this repository yet.

## Architecture

### Blocks

`discovery-chain-index` is the first Block. It builds an index of a discovery
chain, the ordered record of what the harness found, so later blocks can read
that index.

That block is still under review and is not exported into this repository.
When the review finishes, it lands in [`blocks/`](blocks/) as
`blocks/discovery-chain-index`, with the entry script
`scripts/discovery-chain-index.mjs`. The candidate list, including the
`cortex-loop` self-improvement engine, is in [ROADMAP.md](ROADMAP.md).

### Reference adapter

[`packages/dsh-web-cortex-command`](packages/dsh-web-cortex-command/) is the
host-side DSH Web bridge that is already in the tree. The browser sends a
`/cortex` slash command and receives a short summary. The host process calls
`/v1/native-task-pool/{status,enqueue,recover}` on the loopback API with
`CORTEX_API_TOKEN`. Error text has the token replaced with `[redacted]`
before it returns.

```text
browser   slash command, no token     DSH host plugin (this repo)
host      Bearer token, loopback      CORTEX task-pool API
task pool                             CORTEX Kernel
```

The repository root `package.json` is the GitHub-installable bundle for that
plugin. Its `dsh.bundle.patch` field points at
`packages/dsh-web-cortex-command/cordis.patch.yml`.

The adapter is not an allowlisted class in [ALLOWLIST.md](ALLOWLIST.md). It
remains as a pre-allowlist export.

## Website

The docs site is VitePress under [`docs/`](docs/). English pages are the
source. [`docs/zh/`](docs/zh/) is the Chinese display layer. The canonical
host is `cortexharness.org`. `cortexharness.ai` is reserved and has no site.

```sh
npm ci
npm run docs:build
```

The static output is `docs/.vitepress/dist`. Cloudflare Pages project
`cortexharness-org` is named in [wrangler.toml](wrangler.toml). CI builds the
site on push to `main`. It does not deploy.

## Public boundary

Exports follow [ALLOWLIST.md](ALLOWLIST.md). Credentials, vaults, customer
records, store data, and local runtime state stay out. The grep gate enforces
the hard bans.

## License

Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
