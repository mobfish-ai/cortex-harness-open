[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

# Contributing

Thanks for improving Cortex Harness.

## License

This project is licensed under the Apache License, Version 2.0. See
[LICENSE](LICENSE) and [NOTICE](NOTICE).

A pull request is a contribution under that license. Do not add a different
license to new files.

## Setup

Install Node.js 24 or newer, then:

```sh
git clone https://github.com/mobfish-ai/cortex-harness-open.git
cd cortex-harness-open
npm test
```

`npm test` runs the Node.js built-in test runner, the export grep gate, and the CJK gate.
The DSH Web plugin tests start loopback fixtures only. Building the docs site
requires `npm ci` and `npm run docs:build`.

## Pull requests

- Say what a user can do after the change.
- Add or update tests for behavior you change.
- Keep the quickstart in [README.md](README.md) runnable in under five minutes.
- CI on pull requests runs the export grep gate, `npm test`, and the docs
  build on Node.js 24.
- Follow [ALLOWLIST.md](ALLOWLIST.md). The engine and source code are
  English. Simplified Chinese belongs in `*.zh-CN.md`, `docs/zh-CN/`, and
  the CJK fixtures named in `scripts/cjk-allowlist.txt`. CI runs
  `scripts/check-cjk.sh`.

## Public boundary

This repository is the public export. A change belongs here when it can be
read without a private checkout.

Leave these out of commits, fixtures, logs, and docs:

- Tokens, private keys, and passwords
- Customer records and store data
- Private hostnames and private IPv4 addresses
- Home-directory paths, team identifiers, and the other hard bans in
  `ALLOWLIST.md`
- Retired product names listed in `ALLOWLIST.md`

`npm test` runs `scripts/check-export-grep.sh`. Loopback addresses
(`127.0.0.1`, `localhost`, `::1`) are the supported API target and are fine.

## Blocks

Promote a block into [`blocks/`](blocks/) only after the checklist in
[ROADMAP.md](ROADMAP.md). `discovery-chain-index` stays outside this
repository until its review finishes. Land a fresh public implementation
with synthetic fixtures. Do not paste a private tree in.

## Style

The plugin is plain ECMAScript modules. Match the file you are editing.
Prefer the Node.js standard library over a new dependency.
