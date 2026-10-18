[English](BLOCK.md) | [简体中文](BLOCK.zh-CN.md)

# Block · discovery-chain index

Schema `cortex.discovery-chain-index/v1` · Block 0.1.1 · release gate: B (externally reproducible; see `evidence/GATE-B.md`)

## Method contract
- **Input**: a directory whose subdirectories each contain `SKILL.md`, starting with YAML frontmatter (`name`, `description`).
- **Output**: `index.json` (machine-readable), `VERB-TASK-INDEX.md` (for people and agents, grouped by "I want to do X" verbs), `MANIFEST.json` (version plus the sha256 of each file).
- **Guarantees**
  1. No secrets: a secret-shaped description is replaced with `[redacted: secret-shaped text]`. If the output still looks secret-shaped after replacement, the build fails and does not leave a partial index.
  2. Verifiable: `verify` compares each file with the digest in the MANIFEST. Any change fails.
  3. Read-only service: HTTP is GET only (`/healthz`, `/v1/manifest`, `/v1/search?q=`). It listens on 127.0.0.1 by default.
  4. Atomic update: a candidate index is verified, then the whole directory is replaced. The previous version stays in `.prev` for rollback.
  5. Read before work starts: a task or heartbeat uses `before-start` to read verified discovery trees. If any tree fails verification, the whole call fails and the caller must not start work. The command does not write the index.
- **Out of scope**: it does not execute a skill, write the source directory, fetch data over the network, make an authorization decision, or treat `before-start` as authorization.

Verb groups written into the index are English:

| Group |
|---|
| Fix / Troubleshoot |
| Deploy / Operate |
| Data / Query |
| Content / Writing |
| Communication / Messaging |
| Design / Image |
| Code / Repository |
| Other / General |

CJK keywords that map onto those groups live in `fixtures/cjk-verb-keywords.json`. The keywords are fixture data. The labels the engine emits are the English names above.

## Seven elements
| Element | Where it lives |
|---|---|
| Method contract | This file |
| Implementation | `scripts/discovery-chain-index.mjs` (Node 24, zero dependencies) |
| Tests | `scripts/discovery-chain-index.test.mjs` + `fixtures/skills/` + `fixtures/cjk/` |
| Evidence | `evidence/GATE-B.md` (reproduction from scratch on a second clean machine) |
| Runtime adapters | `RUNTIME.md` + `adapters/systemd` and `adapters/launchd` |
| License | `LICENSE` (Apache-2.0, copyright mobfish-ai, including the patent grant) and `NOTICE` |
| Update mechanism | `UPDATE.md` + `CHANGELOG.md` (`update` / `rollback` subcommands) |

`node scripts/discovery-chain-index.mjs elements` checks that all seven elements are present.

## Commands
```
node scripts/discovery-chain-index.mjs build    --skills <dir> --out <index-dir> [--version x.y.z]
node scripts/discovery-chain-index.mjs verify   --index <index-dir>
node scripts/discovery-chain-index.mjs query    --index <index-dir> --q "email follow up"
node scripts/discovery-chain-index.mjs before-start --tree <index-dir> [--tree <index-dir>...] --task "email follow up" [--heartbeat <id>]
node scripts/discovery-chain-index.mjs update   --from <candidate-dir> --index <live-dir>
node scripts/discovery-chain-index.mjs rollback --index <live-dir>
node scripts/discovery-chain-index.mjs serve    --index <live-dir> [--port 8795] [--host 127.0.0.1]
node scripts/discovery-chain-index.mjs elements [--block blocks/discovery-chain-index]
```

`--index` may be used instead of `--tree`. A heartbeat id only identifies the caller. It is not authorization.

## Read before work starts

Discovery trees used to be write-only (`build` / `update`). A task or heartbeat has to read the relevant trees before work starts, or the index is never consumed.

`before-start` is that read-only path:

- Each tree is `verify`'d first. If any tree fails, the result is `TREE_UNVERIFIED`, `results` is empty, and the exit code is 1.
- Missing task text returns `TASK_REQUIRED`. No trees returns `NO_TREES`.
- Secret-shaped task text or a secret-shaped heartbeat id returns `TASK_SECRET_SHAPED` or `HEARTBEAT_SECRET_SHAPED`. The result does not echo the original text.
- Verification can succeed with no hits. The trees were read; none of the skills were relevant.
- It does not write the index, change the source directory, or start work.

## Release gate B reproduction
`bash blocks/discovery-chain-index/reproduce-gate-b.sh <git-url-or-bundle> [ref]` clones the repository into an empty directory (a git URL, a local repository, or a git bundle), runs the tests, checks the Apache-2.0 license, builds, verifies, reads the discovery trees with `before-start` before work, starts the service, queries, updates, rolls back, and prints `GATE_B=PASS` or `GATE_B=FAIL`.

Host Node is used only when it is exactly v24.16.0. Otherwise the script unpacks a checksum-pinned private Node v24.16.0 into a temporary directory and does not change the system Node. `DCI_BOOTSTRAP_NODE=0` refuses the download. Bootstrap needs `curl` or `wget`, and one of `sha256sum`, `shasum`, `openssl`, or `python3`. A bundle is not shallow-cloned.
