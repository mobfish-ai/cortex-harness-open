# Roadmap

The open project is aimed at a public Block set that can earn 1,000 paying
users and GitHub stars. This file lists what is already in the repository,
which Block is first, and which candidates still have to be extracted. It
describes how to extract them. It does not include private source.

## Shipped

`packages/dsh-web-cortex-command` is the DSH Web reference adapter. It is the
installable surface of this repository. It is a bridge to the task-pool API,
and the block directory is still waiting for its first promotion.

## First block: `discovery-chain-index`

Status: under review. Not vendored here.

Source, on `mobfish-ai/cortex-harness` branch `feat/fp08-discovery-chain-index`:

- `blocks/discovery-chain-index`
- `scripts/discovery-chain-index.mjs`

Promotion means copying that reviewed result into `blocks/discovery-chain-index`
in this repository, relicensing it under Apache-2.0, and adding tests that run
in CI. Do that in a follow-up pull request after the branch review accepts the
files. Leave the scripts entrypoint documented, and keep the block free of
workspace paths and credentials.

Later blocks should read this index. That is why it lands first.

## Candidate blocks

### `cortex-loop`

Status: private. Extraction is proposed below and has not started.

`cortex-loop` is the self-improvement engine. Today it lives in the private
repository `kelvinlong/kelvin-obs-base` at `bin/cortex-loop`. This repository
must not receive a copy of that tree.

Extract it as a new public block that reads the discovery index and emits an
improvement record. Keep local policy in the private repository as a thin
wrapper.

#### Cut line

Treat `bin/cortex-loop` as a private entrypoint, not as the block.

The public block may contain:

- A documented module or command entry under `blocks/cortex-loop`
- Functions that accept an index plus a synthetic task fixture and return an
  improvement record
- Tests whose fixtures are obviously invented (`example-task`,
  `fixtures/example.json`)

The public block stays free of:

- Imports from `kelvin-obs-base` or any other private checkout
- Absolute paths, private hostnames, tokens, and customer or store data
- The private wrapper's configuration and local databases

#### Steps

1. In the private repository, write down the observable contract: arguments,
   files read, files written, and exit codes. Keep that note private until
   every path, host, and identifier in it has been removed or replaced with a
   public name.
2. Replace workspace imports with three operations the public block can own:
   - `readIndex` returns discovery-chain records
   - `propose` turns those records into an improvement
   - `emit` writes that improvement as JSON on stdout
3. Implement those operations in this repository against the contract. Use
   the private behavior as the specification. Write the public code fresh,
   with Apache-2.0 headers and synthetic fixtures. Do not copy the private
   files.
4. Point `readIndex` at `discovery-chain-index` once that block has landed.
   Until then, tests can pass a fixture index in the same shape the block
   will publish.
5. Run `npm test`, including the public-boundary scan, in CI.
6. After the block is green, change the private `bin/cortex-loop` into a
   caller of the published package. That follow-up stays in the private
   repository and can keep local policy there.

Land `discovery-chain-index` before `cortex-loop`, so the engine reads a
public index instead of walking a private tree.

### `task-pool-contract`

Status: proposed from the public adapter. No schema file is in this
repository yet.

The adapter already calls `GET /v1/native-task-pool/status` and
`POST /v1/native-task-pool/{enqueue,recover}`. A small versioned schema for
those requests, responses, and the error object would let other clients bind
to the same loopback API. Publish the schema from the messages the adapter
already sends. Leave the server implementation on the CORTEX side.

## Stays closed

These remain CORTEX Kernel authority and are not candidate blocks:

- Leases, replay, receipts, and completion decisions
- Private workspace configuration, vaults, and local databases
- Customer records, store data, tokens, private hostnames, and machine paths

## Promotion checklist

A block moves into `blocks/` when all of these are true:

- The source review that produced it has finished
- `LICENSE` and `NOTICE` apply, and `package.json` or the block docs say
  `Apache-2.0`
- Tests for the block run in CI on Node.js 24
- The public-boundary scan is clean
- The block builds and tests without a private checkout
- The root quickstart still finishes in under five minutes, or the block
  README states the extra tool it needs
