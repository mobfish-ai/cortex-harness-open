# Export

Public files enter this repository through an allowlist. The governing rules
are mirrored in `ALLOWLIST.md` at the root of the repository.

Allowlisted classes are TypeScript contracts, schema, the CORTEX Six Laws /
CORTEX Collaboration Constitution, and this docs site. The engine and the
docs source stay in English. Chinese is limited to the display pages under
`docs/zh/`.

The CI grep gate rejects personal home paths, team identifiers, private
material directories, and retired product names. The spellings live in
`ALLOWLIST.md` and the gate script so the rest of the tree can stay empty of
them.
