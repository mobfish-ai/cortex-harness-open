[English](BLOCK.md) | [简体中文](BLOCK.zh-CN.md)

# Block · 发现链索引服务 (discovery-chain index)

Schema `cortex.discovery-chain-index/v1` · Block 0.1.1 · 放行门：B（外部可复现，见 `evidence/GATE-B.md`）

## 方法合同（method contract）
- **输入**：一个目录，里面每个子目录有 `SKILL.md`，开头是 YAML frontmatter（`name`、`description`）。
- **输出**：`index.json`（机器读）、`VERB-TASK-INDEX.md`（人和 agent 读，按「我要做 X」动词分组）、`MANIFEST.json`（版本 + 每个文件的 sha256）。
- **保证**
  1. 不含密钥：像密钥的描述被替换成 `[redacted: secret-shaped text]`；替换后输出仍像密钥就构建失败，不写半截。
  2. 可校验：`verify` 按 MANIFEST 逐文件比对摘要，任何改动都判失败。
  3. 只读服务：HTTP 只有 GET（`/healthz`、`/v1/manifest`、`/v1/search?q=`），默认只听 127.0.0.1。
  4. 原子更新：候选索引先校验，再整目录替换；旧版留 `.prev` 可回滚。
  5. 开工前先读：任务或心跳用 `before-start` 读取已校验的发现树。任一树校验失败则整次失败，调用方不得开工。该命令不写索引。
- **不做**：不执行 skill，不写源目录，不联网拉数据，不做权限判定，不把 `before-start` 当成授权。

写入索引的动词分组是英文标签：

| 分组标签 | 含义 |
|---|---|
| Fix / Troubleshoot | 修复 / 排障 |
| Deploy / Operate | 部署 / 运维 |
| Data / Query | 数据 / 查询 |
| Content / Writing | 内容 / 写作 |
| Communication / Messaging | 沟通 / 消息 |
| Design / Image | 设计 / 图像 |
| Code / Repository | 代码 / 仓库 |
| Other / General | 其它 / 通用 |

把中文技能文本分到这些英文分组的关键词在 `fixtures/cjk-verb-keywords.json`。关键词是夹具数据。引擎写出的标签是上表里的英文名称。

## 七要素
| 要素 | 落点 |
|---|---|
| 方法合同 | 本文件的英文正文 `BLOCK.md`；本页是对照译文 |
| 实现 | `scripts/discovery-chain-index.mjs`（Node 24，零依赖） |
| 测试 | `scripts/discovery-chain-index.test.mjs` + `fixtures/skills/` + `fixtures/cjk/` |
| 证据 | `evidence/GATE-B.md`（第二台干净机器从零复现记录） |
| Runtime 适配 | `RUNTIME.md` + `adapters/systemd`、`adapters/launchd` |
| 许可证 | `LICENSE`（Apache-2.0，版权 mobfish-ai，含专利授权条款）与 `NOTICE` |
| 更新机制 | `UPDATE.md` + `CHANGELOG.md`（`update` / `rollback` 子命令） |

`node scripts/discovery-chain-index.mjs elements` 机器校验七要素是否齐全。

## 命令
```
node scripts/discovery-chain-index.mjs build    --skills <dir> --out <index-dir> [--version x.y.z]
node scripts/discovery-chain-index.mjs verify   --index <index-dir>
node scripts/discovery-chain-index.mjs query    --index <index-dir> --q "email follow up"
node scripts/discovery-chain-index.mjs before-start --tree <index-dir> [--tree <index-dir>...] --task "email follow up" [--heartbeat <id>]
node scripts/discovery-chain-index.mjs update   --from <candidate-dir> --index <live-dir>
node scripts/discovery-chain-index.mjs rollback --index <live-dir>
node scripts/discovery-chain-index.mjs serve    --index <live-dir> [--port 8795] [--host 127.0.0.1]
node scripts/discovery-chain-index.mjs elements [--block blocks/discovery-chain-index]
```

`--index` 可以代替 `--tree`。心跳 id 只标记调用方，不是授权。

## 开工前消费

发现树以前只有写入（`build` / `update`）。任务或心跳在开工前要先读相关的树，否则索引不会被使用。

`before-start` 是这条只读路径：

- 每棵树先 `verify`。任一棵失败则返回 `TREE_UNVERIFIED`，`results` 为空，退出码为 1。
- 没有任务文本返回 `TASK_REQUIRED`，没有树返回 `NO_TREES`。
- 任务文本或心跳 id 若像密钥，返回 `TASK_SECRET_SHAPED` 或 `HEARTBEAT_SECRET_SHAPED`，结果里不回显原文。
- 校验通过且没有命中仍然是成功：树已经读过，只是没有相关技能。
- 不写索引，不改源目录，不启动工作。

## 放行门 B 复现
`bash blocks/discovery-chain-index/reproduce-gate-b.sh <git-url-or-bundle> [ref]` 从空目录克隆仓库（git URL、本地仓库或 git bundle），跑测试、核对 Apache-2.0 许可证、构建、校验、在开工前 `before-start` 读取发现树、起服务、查询、更新、回滚，并打印 `GATE_B=PASS` 或 `GATE_B=FAIL`。

宿主机上的 Node 只有恰好是 v24.16.0 才会被使用。否则脚本在临时目录里放下一份校验过摘要的私有 Node v24.16.0，不改系统 Node。`DCI_BOOTSTRAP_NODE=0` 时拒绝下载。自举需要 `curl` 或 `wget`，以及 `sha256sum`、`shasum`、`openssl`、`python3` 之一。bundle 不做浅克隆。
