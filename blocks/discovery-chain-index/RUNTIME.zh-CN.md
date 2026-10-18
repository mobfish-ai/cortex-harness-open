[English](RUNTIME.md) | [简体中文](RUNTIME.zh-CN.md)

# Runtime 适配

- 需要：Node 24（仓库锁 24.16.0），无 npm 依赖，无需 pnpm install。
- Linux：`adapters/systemd/discovery-chain-index.service`（用户级 unit，`systemctl --user`）。
- macOS：`adapters/launchd/com.cortex.discovery-chain-index.plist`（LaunchAgent）。
- 其它 runtime（agent 会话、CI）：直接读 `VERB-TASK-INDEX.md`，或调 `query` 子命令，不需要常驻服务。
- 任务或心跳开工前调用 `before-start --tree <index> --task "..." [--heartbeat <id>]`。这是只读消费。树校验失败时退出码为 1，调用方不得开工。`--heartbeat` 不是授权。
- 两个适配文件里的路径都是占位路径 `/opt/cortex-harness`、`/var/lib/cortex/discovery-index`，安装时按机器改；不放任何令牌，服务也不需要令牌。
