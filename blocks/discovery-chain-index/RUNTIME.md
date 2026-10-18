[English](RUNTIME.md) | [简体中文](RUNTIME.zh-CN.md)

# Runtime adapters

- Requires Node 24 (this repository pins 24.16.0). There are no npm dependencies and no pnpm install.
- Linux: `adapters/systemd/discovery-chain-index.service` (a user unit, `systemctl --user`).
- macOS: `adapters/launchd/com.cortex.discovery-chain-index.plist` (a LaunchAgent).
- Other runtimes (an agent session, CI): read `VERB-TASK-INDEX.md` directly, or call the `query` subcommand. A resident service is not required.
- Before a task or heartbeat starts work, call `before-start --tree <index> --task "..." [--heartbeat <id>]`. This is read-only consumption. If tree verification fails, the exit code is 1 and the caller must not start work. `--heartbeat` is not authorization.
- Both adapter files use the placeholder paths `/opt/cortex-harness` and `/var/lib/cortex/discovery-index`. Change them for the machine at install time. They contain no token, and the service does not need one.
