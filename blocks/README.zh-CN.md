[English](README.md) | [简体中文](README.zh-CN.md)

# Block

开放的 Cortex Harness Block 在评审之后进入这个目录，并且其类别必须列在 [ALLOWLIST.md](../ALLOWLIST.md) 中。

## discovery-chain-index

只读的发现链索引 Block（Apache-2.0）。

路径：

- `blocks/discovery-chain-index/`
- `scripts/discovery-chain-index.mjs`
- `scripts/discovery-chain-index.test.mjs`

构建、校验、查询、服务和开工前读取都实现在该脚本里。放行门 B 的证据在 `blocks/discovery-chain-index/evidence/GATE-B.md`。

更多候选，包括 `cortex-loop` 自改进引擎，见 [ROADMAP.md](../ROADMAP.md)。把那个引擎抽成一份新的公开 Block。不要复制私有树。
