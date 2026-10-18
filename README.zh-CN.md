[English](README.md) | [简体中文](README.zh-CN.md)

# Cortex Harness

Cortex Harness 是运行 CORTEX 工作的开放协议和参考工具，工作单位是小型 Block。每个 Block 有自己的入口、测试和公开合同。租约、回放、回执和完成判定仍由 CORTEX Kernel 负责。

公开宪法是 CORTEX 六法，也称 CORTEX 协作宪法。引擎和这些文档的源语言是英文。简体中文对照是 [README.zh-CN.md](README.zh-CN.md) 和 [docs/zh-CN/](docs/zh-CN/)。

本仓库包含 Apache-2.0 许可证、导出允许清单、`cortexharness.org` 文档，以及评审通过的 Block 落入的目录。

## 快速开始

安装 Node.js 24 或更新版本。克隆和测试不需要 CORTEX 服务器，也不需要安装 DSH。

```sh
git clone https://github.com/mobfish-ai/cortex-harness-open.git
cd cortex-harness-open
npm test
```

`npm test` 会运行 Node.js 测试、导出 grep 门禁和 CJK 门禁。

要发送真实命令，在回环地址上运行 CORTEX 任务池服务器，并把适配器安装到本地 DSH Web 配置。令牌只放在宿主机环境里：

```sh
export CORTEX_API_BASE_URL=http://127.0.0.1:8787
export CORTEX_API_TOKEN='token configured on your local task-pool server'
dsh plugin --profile web add "file:$PWD/packages/dsh-web-cortex-command"
dsh web
```

然后在聊天输入框中：

```text
/cortex status
/cortex enqueue <task_id> <manifest> 1
/cortex enqueue <task_id> <manifest> 3
/cortex enqueue <task_id> <manifest> 5
/cortex recover
```

`CORTEX_API_BASE_URL` 必须使用 `127.0.0.1`、`localhost` 或 `::1`。默认值是 `http://127.0.0.1:8787`。`manifest` 是该服务器上清单根目录内的相对路径。适配器可以查看、入队和恢复。结算和完成仍在 CORTEX 一侧。

注册名 `cortex-dsh-web-command` 留给以后的 npm 发布。本仓库目前不发布注册表版本。

## 架构

### Block

`discovery-chain-index` 是第一个 Block。它为发现链建立索引。发现链是 harness 找到的内容的有序记录，供后面的 Block 读取。

该 Block 仍在评审中，还没有导出到本仓库。评审结束后，它会落到 [`blocks/`](blocks/) 的 `blocks/discovery-chain-index`，入口脚本是 `scripts/discovery-chain-index.mjs`。候选名单，包括 `cortex-loop` 自改进引擎，写在 [ROADMAP.md](ROADMAP.md)。

### 参考适配器

[`packages/dsh-web-cortex-command`](packages/dsh-web-cortex-command/) 是已经在树里的宿主机侧 DSH Web 桥。浏览器发送 `/cortex` 斜杠命令并收到一段短摘要。宿主机进程用 `CORTEX_API_TOKEN` 调用回环 API 的 `/v1/native-task-pool/{status,enqueue,recover}`。错误文本在返回前把令牌替换成 `[redacted]`。

```text
browser   slash command, no token     DSH host plugin (this repo)
host      Bearer token, loopback      CORTEX task-pool API
task pool                             CORTEX Kernel
```

仓库根目录的 `package.json` 是这个插件的 GitHub 可安装包。它的 `dsh.bundle.patch` 字段指向 `packages/dsh-web-cortex-command/cordis.patch.yml`。

该适配器不是 [ALLOWLIST.md](ALLOWLIST.md) 里的允许类别。它作为允许清单出现之前的导出保留在树里。

## 网站

文档站是 [`docs/`](docs/) 下的 VitePress 项目。英文页面是源文本。[`docs/zh-CN/`](docs/zh-CN/) 是简体中文展示层。导航上的语言菜单用来切换语言。正式主机名是 `cortexharness.org`。`cortexharness.ai` 为保留域名，不托管站点。

```sh
npm ci
npm run docs:build
```

静态输出在 `docs/.vitepress/dist`。Cloudflare Pages 项目 `cortexharness-org` 写在 [wrangler.toml](wrangler.toml)。CI 在推送到 `main` 时构建站点，不执行部署。

## 公开边界

导出遵循 [ALLOWLIST.md](ALLOWLIST.md)。凭证、保险库、客户记录、店铺数据和本地运行状态都留在仓库外。grep 门禁执行硬性禁令。CJK 门禁把中文、日文和韩文限制在 zh-CN 文档和夹具允许清单内。

## 许可证

Apache License, Version 2.0。见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。

## 参与贡献

[CONTRIBUTING.md](CONTRIBUTING.md) 和 [SECURITY.md](SECURITY.md)。
