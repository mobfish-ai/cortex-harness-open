[English](README.md) | [简体中文](README.zh-CN.md)

# CORTEX DSH Web 命令

这是一个只在宿主机上运行的 DSH Web 插件。它通过 DSH 的 `ctx.commands` 服务注册一条斜杠命令 `/cortex`。浏览器把命令文本发给 DSH 宿主机；宿主机调用经过认证的 CORTEX 本机 API。浏览器永远拿不到 `CORTEX_API_TOKEN`，插件也不能结算任务或把工作标成完成。

本包使用 Apache License, Version 2.0（见 `LICENSE` 和 `NOTICE`）。本仓库里的源码就是包 `cortex-dsh-web-command`。包的公开表面只包含插件源码、文档和许可证。注册表版本尚未发布。发布之后的公开安装形式是：

```sh
npm install cortex-dsh-web-command
```

## 安装到本地 DSH Web 配置

从本地检出把包安装进 DSH 的 `web` 配置：

```sh
dsh plugin --profile web add file:/absolute/path/to/cortex-harness-open/packages/dsh-web-cortex-command
```

启动 Web 配置之前，在 DSH 宿主机进程的环境里设置：

```sh
export CORTEX_API_BASE_URL=http://127.0.0.1:8787
export CORTEX_API_TOKEN='same-token-used-by-cortex-task-pool-server'
dsh web
```

默认 CORTEX 地址是 `http://127.0.0.1:8787`。插件拒绝非本机地址。不要把令牌放进 `cordis.patch.yml`、浏览器代码、URL 或已提交的文件。

安装后重启 DSH Web。在聊天输入框中使用：

```text
/cortex status
/cortex enqueue <task_id> <manifest> 1
/cortex enqueue <task_id> <manifest> 3
/cortex enqueue <task_id> <manifest> 5
/cortex recover
```

`manifest` 相对 CORTEX 服务器上配置的清单根目录。任务池、Kernel、租约、回放和回执仍以 CORTEX 一侧为准。

## 配置补丁

本包声明官方的嵌套 `dsh.bundle.patch` 元数据（JSON 形状是 `dsh: { bundle: { patch: "./cordis.patch.yml" } }`）。如果配置需要手工补丁，把这一行加进 Web 配置的补丁文件：

```yaml
- insert:
    - id: cortex-dsh-web-command
      name: cortex-dsh-web-command
```

删掉这一行并运行 `dsh plugin --profile web remove cortex-dsh-web-command` 即可卸载。本包没有浏览器包，也不声明 DSH Web UI 面板或新的 Typert 命名空间；斜杠命令是最小的宿主机侧 Web 入口。

## 本地冒烟测试

冒烟测试启动一个模拟的 DSH Web 命令面和一个模拟的 CORTEX API，然后检查 `status`、`enqueue`、`recover`、畸形输入和缺少令牌的处理：

```sh
npm test
```

在本包目录里，同样的检查是：

```sh
node --test test/smoke.test.mjs test/package-pack.test.mjs
```

第一个测试还会检查包入口和声明的配置补丁能够加载，并且补丁注册了宿主机命令。模拟部分证明的是本地命令到 API 的边界。它不能证明真实的 DSH Web 安装、配置加载器或远程 DSH Web 部署；那些需要一台装了 DSH Web 的机器和一台真实的 CORTEX 服务器。

包的冒烟测试还会运行 `npm pack --dry-run` 并核对公开文件列表。发布到注册表，或把这条命令列进 DSH 市场，是另一步，需要真实的注册表账号、凭证，以及一次独立的公开回读。
