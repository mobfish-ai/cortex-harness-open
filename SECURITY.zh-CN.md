[English](SECURITY.md) | [简体中文](SECURITY.zh-CN.md)

# 安全

## 报告漏洞

使用 GitHub 的私密漏洞报告：

<https://github.com/mobfish-ai/cortex-harness-open/security/advisories/new>

请给出受影响的路径、版本或提交，以及复现方法。公开 issue 里不要放入令牌、客户记录和店铺数据。如果这类材料已经在树里，请在私密报告中说明位置，并开一个把它删掉的拉取请求。

## 插件保护什么

`packages/dsh-web-cortex-command` 运行在 DSH 宿主机进程里。

- 浏览器发送斜杠命令文本。它拿不到 `CORTEX_API_TOKEN`。
- 只有当 `CORTEX_API_BASE_URL` 是回环 URL（`127.0.0.1`、`localhost` 或 `::1`）时，宿主机才会调用 CORTEX 任务池 API。
- 命令错误在文本返回给调用方之前，把令牌替换成 `[redacted]`。

插件可以请求状态、入队和恢复。结算和完成仍在 CORTEX 一侧。

## 范围

针对本仓库代码和文档的报告在范围内，包括令牌处理和回环检查。

CORTEX Kernel、私有托管的任务池服务器，以及 DSH Web 本身是独立产品。请向它们各自的维护者报告。

## 支持的版本

| 版本 | 报告 |
| --- | --- |
| `main` 上的 `0.1.0` 源码 | 接受 |
| npm 注册表 | 尚未发布 |
| GitHub Releases | 尚未发布 |

## 密钥

不要提交凭证、客户数据或机器本地路径。测试套件包含一次公开边界扫描，检查主目录路径、私钥块、常见令牌前缀、Shopify 店铺主机和私有 IPv4 网段。
