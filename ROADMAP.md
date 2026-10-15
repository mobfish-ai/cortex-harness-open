# Roadmap

The open project is aimed at a public Block set that can earn 1,000 paying
users and GitHub stars. This file lists what is already in the repository,
which Block is first, and which candidates still have to be extracted. It
describes how to extract them. It does not include private source.

## Shipped in this repository

`packages/dsh-web-cortex-command` is the DSH Web reference adapter. It is a
bridge to the task-pool API. It predates [ALLOWLIST.md](ALLOWLIST.md) and is
not an allowlisted class.

The docs site for `cortexharness.org` is the VitePress project in `docs/`.

## First block: `discovery-chain-index`

Status: under review. Not exported here.

The reviewed result belongs in `blocks/discovery-chain-index`, under
Apache-2.0, with tests that run in CI. The entry script is
`scripts/discovery-chain-index.mjs`. Keep the block free of workspace paths
and credentials.

Later blocks should read this index. That is why it lands first.

## Candidate blocks

### `cortex-loop`

Status: candidate. Not exported.

`cortex-loop` is the self-improvement engine. Extract it only after
`discovery-chain-index` is in `blocks/`, and only as a fresh public
implementation that reads the discovery index and emits an improvement
record. Keep local policy outside this repository, as a thin wrapper.

#### Cut line

The public block may contain:

- A documented module or command entry under `blocks/cortex-loop`
- Functions that accept an index plus a synthetic task fixture and return an
  improvement record
- Tests whose fixtures are obviously invented (`example-task`,
  `fixtures/example.json`)

The public block stays free of private checkouts, absolute paths, tokens, and
customer or store data.

#### Steps

1. Write the observable contract privately: arguments, files read, files
   written, and exit codes. Keep that note private until every path, host,
   and identifier in it has been removed or replaced with a public name.
2. Replace private imports with three operations the public block can own:
   - `readIndex` returns discovery-chain records
   - `propose` turns those records into an improvement
   - `emit` writes that improvement as JSON on stdout
3. Implement those operations in this repository against the contract. Use
   private behavior as the specification. Write the public code fresh, with
   Apache-2.0 headers and synthetic fixtures. Do not copy private files.
4. Point `readIndex` at `discovery-chain-index` once that block has landed.
   Until then, tests can pass a fixture index in the same shape the block
   will publish.
5. Run `npm test`, including the export grep gate, in CI.
6. After the block is green, point the private entrypoint at the published
   package. That follow-up stays outside this repository.

Land `discovery-chain-index` before `cortex-loop`, so the engine reads a
public index.

### `task-pool-contract`

Status: proposed from the public adapter. No schema file is in this
repository yet.

The adapter already calls `GET /v1/native-task-pool/status` and
`POST /v1/native-task-pool/{enqueue,recover}`. A small versioned schema for
those requests, responses, and the error object would let other clients bind
to the same loopback API. Publish the schema from the messages the adapter
already sends. Schema is an allowlisted class. Leave the server
implementation on the CORTEX side.

### CORTEX Six Laws

Status: named, not yet exported.

The public constitution is the CORTEX Six Laws / CORTEX Collaboration
Constitution. The English text is allowlisted. The docs page at
`docs/constitution.md` is the place it will land. The Chinese page stays a
display translation.

## Stays closed

These remain CORTEX Kernel authority and are not candidate blocks:

- Leases, replay, receipts, and completion decisions
- Private workspace configuration, vaults, and local databases
- Customer records, store data, tokens, private hostnames, and machine paths

## Promotion checklist

A block moves into `blocks/` when all of these are true:

- The source review that produced it has finished
- The block's class is listed in `ALLOWLIST.md`
- `LICENSE` and `NOTICE` apply, and the block docs say `Apache-2.0`
- Tests for the block run in CI on Node.js 24
- The export grep gate is clean
- The block builds and tests without a private checkout
- The root quickstart still finishes in under five minutes, or the block
  README states the extra tool it needs
