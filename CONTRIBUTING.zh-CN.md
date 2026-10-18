[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

# 参与贡献

感谢改进 Cortex Harness。

## 许可证

本项目使用 Apache License, Version 2.0。见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。

拉取请求即表示按该许可证贡献。不要给新文件换一种许可证。

## 环境

安装 Node.js 24 或更新版本，然后：

```sh
git clone https://github.com/mobfish-ai/cortex-harness-open.git
cd cortex-harness-open
npm test
```

`npm test` 运行 Node.js 内置测试、导出 grep 门禁和 CJK 门禁。DSH Web 插件测试只启动回环夹具。构建文档站需要 `npm ci` 和 `npm run docs:build`。

## 拉取请求

- 说明改完之后用户能做什么。
- 为你改变的行为添加或更新测试。
- 让 [README.md](README.md) 里的快速开始能在五分钟内跑完。
- 拉取请求上的 CI 在 Node.js 24 上运行导出 grep 门禁、`npm test` 和文档构建。
- 遵守 [ALLOWLIST.md](ALLOWLIST.md)。引擎和源码使用英文。简体中文只属于 `*.zh-CN.md`、`docs/zh-CN/`，以及 `scripts/cjk-allowlist.txt` 点名的 CJK 夹具。CI 会运行 `scripts/check-cjk.sh`。

## 公开边界

本仓库是公开导出。一项改动能在没有私有检出的情况下被读懂，才属于这里。

提交、夹具、日志和文档里不要放入：

- 令牌、私钥和密码
- 客户记录和店铺数据
- 私有主机名和私有 IPv4 地址
- 主目录路径、团队标识，以及 `ALLOWLIST.md` 里的其他硬性禁令
- `ALLOWLIST.md` 列出的退役产品名

`npm test` 会运行 `scripts/check-export-grep.sh`。回环地址（`127.0.0.1`、`localhost`、`::1`）是支持的 API 目标，可以使用。

## Block

只有完成 [ROADMAP.md](ROADMAP.md) 里的清单之后，才把 Block 提升进 [`blocks/`](blocks/)。`discovery-chain-index` 在评审结束前留在本仓库之外。落地时写一份新的公开实现和合成夹具。不要粘贴私有树。

## 风格

插件是普通 ECMAScript 模块。跟你正在改的文件保持一致。优先使用 Node.js 标准库，而不是新依赖。
