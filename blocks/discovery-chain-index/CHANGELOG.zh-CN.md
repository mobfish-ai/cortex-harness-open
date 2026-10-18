[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

# 变更记录 · discovery-chain index Block

## 0.1.1 · 2026-10-15
- 许可证定为 Apache-2.0，版权 mobfish-ai，并加入 NOTICE。`block.json` 记录 `license`、`copyright`、`publish: false`、`publication: private_until_sanitization_audit`。脱敏审计完成前不公开、不发版。
- 开工前消费：`before-start` 在任务或心跳开工前只读查询发现树。校验失败、缺任务或像密钥的输入都整次失败，且不回显密钥形文本。
- 放行门 B 复现脚本在宿主机没有 Node v24.16.0 时自举私有运行时，接受 git bundle，并在开工前读取发现树。
- 放行门 B：无 Node 的 PATH 上，本地 `file://` 与 git bundle 复现均为 `GATE_B=PASS`。变基后的树 `eb29e8a5` 再跑仍 PASS。`release_gate` 为 B。

## 0.1.0 · 2026-10-15
- 首版：build / verify / query / update / rollback / serve / elements。
- 七要素齐备；放行门 A，B 复现脚本就位。
- 许可证定为 Apache-2.0（2026-10-15），新增 NOTICE。
