[English](ROADMAP.md) | [简体中文](ROADMAP.zh-CN.md)

# 路线图

开放项目的目标是一套能获得 1,000 名付费用户和 GitHub star 的公开 Block。本文件列出仓库里已经有什么、第一个 Block 是哪个，以及哪些候选还要抽出来。它说明怎么抽。它不包含私有源码。

## 已经在本仓库里

`packages/dsh-web-cortex-command` 是 DSH Web 参考适配器。它是通往任务池 API 的桥。它早于 [ALLOWLIST.md](ALLOWLIST.md)，不是允许清单上的类别。

`cortexharness.org` 的文档站是 `docs/` 里的 VitePress 项目。

## 第一个 Block：`discovery-chain-index`

状态：评审中。尚未导出到这里。

评审结果应放在 `blocks/discovery-chain-index`，使用 Apache-2.0，测试在 CI 里运行。入口脚本是 `scripts/discovery-chain-index.mjs`。Block 里不要有工作区路径和凭证。

后面的 Block 应该读取这个索引。所以它第一个落地。

## 候选 Block

### `cortex-loop`

状态：候选。尚未导出。

`cortex-loop` 是自改进引擎。只有在 `discovery-chain-index` 进入 `blocks/` 之后才抽取它，并且只作为一份新的公开实现：读取发现索引，发出一条改进记录。本地策略留在本仓库之外，做成一层薄包装。

#### 切割线

公开 Block 可以包含：

- `blocks/cortex-loop` 下有文档的模块或命令入口
- 接受索引加上合成任务夹具、并返回改进记录的函数
- 夹具明显是编出来的测试（`example-task`、`fixtures/example.json`）

公开 Block 不包含私有检出、绝对路径、令牌，以及客户或店铺数据。

#### 步骤

1. 私下写下可观察合同：参数、读取的文件、写入的文件和退出码。在其中每条路径、主机和标识都被删掉或换成公开名称之前，这份笔记保持私有。
2. 用公开 Block 可以拥有的三个操作替换私有导入：
   - `readIndex` 返回发现链记录
   - `propose` 把这些记录变成一条改进
   - `emit` 把改进写成 stdout 上的 JSON
3. 在本仓库里按合同实现这些操作。把私有行为当作规格。公开代码重新写，带 Apache-2.0 文件头和合成夹具。不要复制私有文件。
4. 等 `discovery-chain-index` 落地后，让 `readIndex` 指向它。在那之前，测试可以传入一份形状相同的夹具索引。
5. 在 CI 里运行 `npm test`，包括导出 grep 门禁。
6. Block 变绿之后，把私有入口指到已发布的包。这个后续步骤留在本仓库之外。

先落地 `discovery-chain-index`，再落地 `cortex-loop`，这样引擎读的是公开索引。

### `task-pool-contract`

状态：从公开适配器提出。本仓库里还没有 schema 文件。

适配器已经调用 `GET /v1/native-task-pool/status` 和 `POST /v1/native-task-pool/{enqueue,recover}`。给这些请求、响应和错误对象做一个小的版本化 schema，其他客户端就能绑定同一个回环 API。schema 从适配器已经发送的消息发布。schema 是允许清单上的类别。服务器实现留在 CORTEX 一侧。

### CORTEX 六法

状态：已命名，尚未导出。

公开宪法是 CORTEX 六法 / CORTEX 协作宪法。英文正文在允许清单上。它将落在 `docs/constitution.md`。简体中文页面 `docs/zh-CN/constitution.md` 保持为展示译文。

## 保持封闭

这些仍是 CORTEX Kernel 的职权，不是候选 Block：

- 租约、回放、回执和完成判定
- 私有工作区配置、保险库和本地数据库
- 客户记录、店铺数据、令牌、私有主机名和机器路径

## 提升清单

一个 Block 进入 `blocks/` 时，下面各项都要为真：

- 产生它的源码评审已经结束
- 该 Block 的类别列在 `ALLOWLIST.md` 里
- `LICENSE` 和 `NOTICE` 适用，并且 Block 文档写明 `Apache-2.0`
- Block 的测试在 Node.js 24 的 CI 上运行
- 导出 grep 门禁干净
- Block 的构建和测试不需要私有检出
- 根目录快速开始仍能在五分钟内完成，或者 Block 的 README 写明它额外需要的工具
