# Blocks

Open Cortex Harness blocks are promoted into this directory after review, and
only when their class is listed in [ALLOWLIST.md](../ALLOWLIST.md).

## discovery-chain-index

Read-only discovery-chain index Block (Apache-2.0).

Paths:

- `blocks/discovery-chain-index/`
- `scripts/discovery-chain-index.mjs`
- `scripts/discovery-chain-index.test.mjs`

Build, verify, query, serve, and before-start are implemented in the script.
Gate-B evidence is under `blocks/discovery-chain-index/evidence/GATE-B.md`.

See [ROADMAP.md](../ROADMAP.md) for further candidates, including the
`cortex-loop` self-improvement engine. Extract that engine as a fresh public
block. Do not copy a private tree in.
