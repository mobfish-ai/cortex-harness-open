[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

# Changelog · discovery-chain index Block

## 0.1.1 · 2026-10-15
- License set to Apache-2.0, copyright mobfish-ai, with a NOTICE. `block.json` records `license`, `copyright`, `publish: false`, and `publication: private_until_sanitization_audit`. It was not public and was not released until the sanitization audit finished.
- Read before work: `before-start` queries discovery trees read-only before a task or heartbeat starts. Failed verification, a missing task, or secret-shaped input fails the whole call and does not echo secret-shaped text.
- The release-gate B reproduction script bootstraps a private runtime when the host has no Node v24.16.0, accepts a git bundle, and reads discovery trees before work starts.
- Release gate B: on a PATH with no Node, both the local `file://` reproduction and the git bundle reproduction printed `GATE_B=PASS`. After rebase, tree `eb29e8a5` still PASSed. `release_gate` is B.

## 0.1.0 · 2026-10-15
- First version: build / verify / query / update / rollback / serve / elements.
- All seven elements present; release gate A, with the gate B reproduction script in place.
- License set to Apache-2.0 (2026-10-15), and NOTICE added.
