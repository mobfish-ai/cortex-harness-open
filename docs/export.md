[English](./export.md) | [简体中文](./zh-CN/export.md)

# Export

Public files enter this repository through an allowlist. The governing rules
are mirrored in `ALLOWLIST.md` at the root of the repository.

Allowlisted classes are TypeScript contracts, schema, the CORTEX Six Laws /
CORTEX Collaboration Constitution, and this docs site. The engine and other
source code stay in English. Simplified Chinese is the display layer under
`docs/zh-CN/`, with counterparts such as `README.zh-CN.md`.

The CI grep gate rejects personal home paths, team identifiers, private
material directories, and retired product names. The spellings live in
`ALLOWLIST.md` and the gate script so the rest of the tree can stay empty of
them. A separate CJK gate rejects Chinese, Japanese, and Korean characters
outside `docs/zh-CN/`, `*.zh-CN.md`, and the fixture paths listed in
`scripts/cjk-allowlist.txt`.
