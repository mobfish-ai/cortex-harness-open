[English](../export.md) | [简体中文](./export.md)

# 导出

进入本仓库的公开文件必须位于允许清单上。规则的完整镜像写在仓库根目录的 `ALLOWLIST.md`。

允许导出的类别包括 TypeScript 契约、schema、CORTEX 六法 / CORTEX 协作宪法，以及这个文档站。引擎和其他源码使用英文。简体中文是 `docs/zh-CN/` 下的展示层，并包括 `README.zh-CN.md` 这类对照文档。

CI 的 grep 门禁会拒绝个人主目录路径、团队标识、私有材料目录和已退役的产品名。具体拼写只写在 `ALLOWLIST.md` 和门禁脚本中，以免出现在其余文件里。另一道 CJK 门禁会拒绝出现在 `docs/zh-CN/`、`*.zh-CN.md` 和 `scripts/cjk-allowlist.txt` 所列夹具路径之外的中文、日文和韩文。
