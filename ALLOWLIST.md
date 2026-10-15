# Export allowlist

This file mirrors `OPEN-SOURCE-EXPORT.md` (21 August 2026, private OB1
repository). That spec is the governing rule for what may enter this
repository. The CI grep gate scans every tracked file except this file and
`scripts/check-export-grep.sh`, which are the only places the banned spellings
are written down.

## 1. Allowlist-only export

Start from an empty repository. Never fork history. Export only allowlisted
items.

Allowlisted classes:

- TypeScript contracts
- Schema
- The public constitution: CORTEX Six Laws / CORTEX Collaboration Constitution
- This allowlist, the Apache-2.0 `LICENSE` and `NOTICE`, and the
  `cortexharness.org` docs site
- Discovery-chain index Block: `blocks/discovery-chain-index/**`,
  `scripts/discovery-chain-index.mjs`, and `scripts/discovery-chain-index.test.mjs`
  (Apache-2.0; no private repository or branch names in public files; scrub
  internal hostnames before export)

A new class of file needs an explicit addition to this list before it is
exported.

Present in the tree and not on this allowlist:

- `packages/dsh-web-cortex-command`, the JavaScript DSH Web adapter and its
  tests

That package was committed before this allowlist existed. This file does not
retroactively allow it.

## 2. Hard bans

Grep must find zero matches before anything is exported:

- `/Users/klong/`
- Internal names, and `team_id` / `team_ids`
- `reports/`
- `governance/`
- `legacy/` material
- `reference-assets`

The gate script also rejects private account names and private repository
coordinates that were removed from the tree.

## 3. Language

The engine defaults to English. Chinese and English together are allowed only
in the front-end display layer under `docs/`.

## 4. Names

The product name is Cortex Harness.

The public constitution is the CORTEX Six Laws, also called the CORTEX
Collaboration Constitution.

Retired names must not appear:

- Mobfish Harness
- Codex Harness
- Airlock

## 5. Website

The website is `cortexharness.org`. It is a VitePress static site. A push to
`main` builds it. The Cloudflare Pages project name is `cortexharness-org`.
Build configuration lives in `wrangler.toml`. Connecting the project, changing
DNS, and deploying are outside this repository's automation.

`cortexharness.ai` is reserved and gets no site. Do not attach that hostname
to the Pages project.

## Gate

`bash scripts/check-export-grep.sh` runs in CI. It fails when a banned pattern
appears outside this file and the script.
