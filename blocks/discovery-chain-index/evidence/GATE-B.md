[English](GATE-B.md) | [简体中文](GATE-B.zh-CN.md)

# Release gate B evidence · discovery-chain index

Gate B means externally reproducible: a second machine reproduces the block from scratch (commercial Block release gate B).

## Run 1 · 2026-10-15 20:41 (UTC+8)
- Machine: a remote Linux reproduction machine (x86_64), not the development machine. System Node was v18 and was not changed. With `DCI_BOOTSTRAP_NODE=1`, the script unpacked a private Node v24.16.0 into the temporary work directory (SHASUMS256 check passed).
- Source: a git bundle (commit under test `099742c4acee`), cloned into a new empty directory from `mktemp -d`.
- Command: `DCI_BOOTSTRAP_NODE=1 bash reproduce-gate-b.sh <bundle> <commit-or-ref>`

```
STEP bootstrap  private node v24.16.0 (sha256 verified)
STEP runtime    node v24.16.0 Linux x86_64
STEP clone      099742c4acee7b8e58dfe4c349d61a14fb0a1054
STEP elements   7/7
STEP build      v1 verified
STEP serve      healthz 200, search ok, POST 405
STEP update     v1->v2 swapped, rollback to v1 ok
STEP secrets    none in output
GATE_B=PASS
```
The test step passed (the script aborts when tests fail). The count-printing regular expression at the time did not match Node 24's `ℹ pass` format. That was fixed in the same pull request.

## Run 2 · 2026-10-15 (UTC)
- Machine: a remote Linux reproduction machine (x86_64). PATH was only `/usr/bin:/bin`, and `node` was not on it. System Node was not changed. The script unpacked a private Node v24.16.0 into the temporary directory. The digest matched the official SHASUMS256 pin in the script.
- Commit under test: `dbcaa1eb2616380863c7ef2f1daa80f8b257a614`.
- Two reproductions from an empty directory, with the same result:
  1. Local repository, `file://` shallow clone (so git does not ignore `--depth` for a local path).
  2. `git bundle` (full clone, then checkout; a bundle cannot be shallow-cloned).

```
STEP bootstrap  private node v24.16.0 checksum ok
STEP runtime    node v24.16.0 Linux x86_64
STEP clone      dbcaa1eb2616380863c7ef2f1daa80f8b257a614
STEP tests      pass 11 fail 0
STEP elements   7/7
STEP license    Apache-2.0 mobfish-ai
STEP build      v1 verified
STEP consult    read before start; unverified tree rejected
STEP serve      healthz 200, search ok, POST 405
STEP update     v1->v2 swapped, rollback to v1 ok
STEP secrets    none in output
GATE_B=PASS
```

## Run 3 · 2026-10-15 (UTC)
After rebasing onto the parallel Apache-2.0 commit, the same script was run again on tree `eb29e8a55571a0df55d5a457bdd09ed52fd31565`. PATH was still `/usr/bin:/bin` (no node). Both the local `file://` run and the git bundle run printed `GATE_B=PASS`. The steps matched Run 2, and `STEP clone` was that commit.

## Verdict
Release gate B: **PASS**. `release_gate` in `block.json` is B. Copyright mobfish-ai. This Block is exported to the public repository under the allowlist. License Apache-2.0.
