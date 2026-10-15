# 更新机制

1. **数据更新**（技能目录变了）：在源机器上 `build --out <candidate>`，把候选目录送到目标机器（scp / rsync / git），再跑 `update --from <candidate> --index <live>`。
   - 候选先过 `verify`，不过就拒绝，线上索引不动。
   - 内容摘要没变时返回 `UP_TO_DATE`，不重复替换。
   - 替换是整目录 rename；旧版留在 `<live>.prev`。
   - 出问题跑 `rollback --index <live>`，坏版本移到 `<live>.rejected` 留证。
2. **代码更新**（本 Block 新版本）：只走仓库 PR；版本号写在 `block.json` 和 `CHANGELOG.md`。schema 有不兼容改动时升 `cortex.discovery-chain-index/v2`，旧索引 `verify` 会报 `SCHEMA_MISMATCH`，必须重建。
3. **定时**：生产里由宿主机定时任务（launchd / systemd timer / cron）每日跑 build + update；服务本身不定时、不联网。
4. **开工前读取不是更新**：`before-start` 只读已校验的发现树，不替换索引，也不授权开工。
