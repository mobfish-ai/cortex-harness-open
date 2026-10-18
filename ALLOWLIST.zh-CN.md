[English](ALLOWLIST.md) | [简体中文](ALLOWLIST.zh-CN.md)

# 导出允许清单

本文件是 `OPEN-SOURCE-EXPORT.md`（2026 年 8 月 21 日，私有 OB1 仓库）的译文。那份说明是什么可以进入本仓库的权威规则。CI 的 grep 门禁会扫描除英文 `ALLOWLIST.md` 和 `scripts/check-export-grep.sh` 之外的每个已跟踪文件。被禁拼写只写在那两个文件里。本译文不重复那些拼写。

## 1. 只导出允许清单上的内容

从空仓库开始。不要分叉历史。只导出允许清单上的项目。

允许的类别：

- TypeScript 契约
- Schema
- 公开宪法：CORTEX 六法 / CORTEX 协作宪法
- 本允许清单、Apache-2.0 的 `LICENSE` 和 `NOTICE`，以及 `cortexharness.org` 文档站
- 发现链索引 Block：`blocks/discovery-chain-index/**`、`scripts/discovery-chain-index.mjs` 和 `scripts/discovery-chain-index.test.mjs`（Apache-2.0；公开文件里不写私有仓库或分支名；导出前清掉内部主机名）

新的文件类别在导出前必须先明确加进这份清单。

已经在树里、但不在允许清单上的内容：

- `packages/dsh-web-cortex-command`，JavaScript DSH Web 适配器及其测试

这个包在允许清单存在之前就已经提交。本文件不追溯允许它。

## 2. 硬性禁令

导出前 grep 必须零命中。被禁拼写只写在英文允许清单和门禁脚本里。它们覆盖个人主目录路径、内部名称和团队标识、若干私有材料目录，以及已经从树里删除的私有账号名和私有仓库坐标。

## 3. 语言

引擎和源码默认使用英文。产品名是 Cortex Harness。公开宪法是 CORTEX 六法，也称 CORTEX 协作宪法。

简体中文只允许出现在：

- 面向用户的文档：`docs/zh-CN/**` 和 `*.zh-CN.md` 对照文件，包括 [README.zh-CN.md](README.zh-CN.md)
- 英文页面上的语言切换行 `[English](README.md) | [简体中文](README.zh-CN.md)`
- `scripts/cjk-allowlist.txt` 列出的显式 CJK 夹具

这些夹具存放用于分类的中文技能样例和关键词。发现链索引用来给这些文本分类。引擎写出的分组标签是英文。

`bash scripts/check-cjk.sh` 会在允许清单之外出现 CJK 字符时失败。导出 grep 门禁保持不变。

## 4. 名称

产品名是 Cortex Harness。

公开宪法是 CORTEX 六法，也称 CORTEX 协作宪法。

退役名称不得出现。具体拼写只写在英文允许清单和门禁脚本中。

## 5. 网站

网站是 `cortexharness.org`。它是 VitePress 静态站点。推送到 `main` 会构建它。Cloudflare Pages 项目名是 `cortexharness-org`。构建配置在 `wrangler.toml`。连接项目、修改 DNS 和部署都不在本仓库的自动化里。

`cortexharness.ai` 是保留域名，不托管站点。不要把该主机名绑到 Pages 项目上。

## 门禁

`bash scripts/check-export-grep.sh` 在 CI 中运行。被禁模式出现在本文件和该脚本之外时，门禁失败。英文允许清单才是被排除扫描的那一份；本译文同样接受扫描，所以这里不写被禁拼写。
