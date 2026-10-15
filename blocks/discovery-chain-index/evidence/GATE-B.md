# 放行门 B 证据 · 发现链索引服务

门 B = 外部可复现：第二台机器从零复现（定义见商业化积木放行门 B）。

## Run 1 · 2026-10-15 20:41 (UTC+8)
- 机器：远程 Linux 复现机（x86_64），不是开发机。系统 Node 是 v18，未改动；脚本按 `DCI_BOOTSTRAP_NODE=1` 在临时工作目录里放了一份私有 Node v24.16.0（SHASUMS256 校验通过）。
- 源：git bundle（被测提交 `099742c4acee`），新建空目录 `mktemp -d` 克隆。
- 命令：`DCI_BOOTSTRAP_NODE=1 bash reproduce-gate-b.sh <bundle> <commit-or-ref>`

```
STEP bootstrap  private node v24.16.0 (sha256 verified)
STEP runtime    node v24.16.0 Linux x86_64
STEP clone      099742c4acee7b8e58dfe4c349d61a14fb0a1054
STEP elements   7/7
STEP build      v1 verified
STEP serve      healthz 200, search ok, POST 405
STEP update     v1->v2 swapped, rollback to v1 ok
STEP secrets    none in output
GATE_B=PASS
```
测试步骤通过（脚本在测试失败时会中止）；当时的计数打印正则没匹配上 Node 24 的 `ℹ pass` 格式，已在本 PR 修正。

## Run 2 · 2026-10-15 (UTC)
- 机器：远程 Linux 复现机（x86_64）。PATH 只有 `/usr/bin:/bin`，上面没有 `node`。未改系统 Node。脚本在临时目录放下私有 Node v24.16.0，摘要与脚本内钉死的官方 SHASUMS256 一致。
- 被测提交：`dbcaa1eb2616380863c7ef2f1daa80f8b257a614`。
- 两次从空目录复现，结果相同：
  1. 本地仓库，`file://` 浅克隆（避免 git 对本地路径忽略 `--depth`）。
  2. `git bundle`（完整克隆后再 checkout；bundle 不能浅克隆）。

```
STEP bootstrap  private node v24.16.0 checksum ok
STEP runtime    node v24.16.0 Linux x86_64
STEP clone      dbcaa1eb2616380863c7ef2f1daa80f8b257a614
STEP tests      pass 11 fail 0
STEP elements   7/7
STEP license    Apache-2.0 mobfish-ai
STEP build      v1 verified
STEP consult    read before start; unverified tree rejected
STEP serve      healthz 200, search ok, POST 405
STEP update     v1->v2 swapped, rollback to v1 ok
STEP secrets    none in output
GATE_B=PASS
```

## Run 3 · 2026-10-15 (UTC)
变基到并行的 Apache-2.0 提交之后，同一脚本再跑当前树 `eb29e8a55571a0df55d5a457bdd09ed52fd31565`。PATH 仍是 `/usr/bin:/bin`（没有 node）。本地 `file://` 与 git bundle 都是 `GATE_B=PASS`，步骤与 Run 2 相同，`STEP clone` 为该提交。

## 判定
放行门 B：**PASS**。`block.json` 的 `release_gate` 为 B。版权 mobfish-ai。本 Block 已按 allowlist 导出到公开仓；许可证 Apache-2.0。
