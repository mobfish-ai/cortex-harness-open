[English](UPDATE.md) | [简体中文](UPDATE.zh-CN.md)

# Update mechanism

1. **Data update** (the skill directory changed): on the source machine, `build --out <candidate>`, deliver the candidate directory to the target machine (scp / rsync / git), then run `update --from <candidate> --index <live>`.
   - The candidate must pass `verify`. If it does not, it is rejected and the live index stays put.
   - When the content digests are unchanged, the result is `UP_TO_DATE` and nothing is replaced.
   - Replacement is a whole-directory rename. The previous version stays at `<live>.prev`.
   - If something is wrong, run `rollback --index <live>`. The bad version moves to `<live>.rejected` and is kept as evidence.
2. **Code update** (a new version of this Block): repository pull requests only. The version is written in `block.json` and `CHANGELOG.md`. An incompatible schema change moves to `cortex.discovery-chain-index/v2`. `verify` on an old index reports `SCHEMA_MISMATCH`, and the index must be rebuilt.
3. **Schedule**: in production, a host scheduler (launchd / systemd timer / cron) runs build + update daily. The service itself has no timer and does not use the network.
4. **Reading before work is not an update**: `before-start` only reads verified discovery trees. It does not replace the index and it does not authorize work to start.
