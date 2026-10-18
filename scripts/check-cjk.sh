#!/bin/sh
# CJK gate. Chinese, Japanese, and Korean characters may appear only in
# paths listed in scripts/cjk-allowlist.txt. English pages may also carry
# the language-switch label, built below from code points so this script
# itself stays free of those characters.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "CJK gate requires a git checkout" >&2
  exit 1
fi

python3 - "$root" << 'PY'
import fnmatch
import pathlib
import re
import subprocess
import sys

root = pathlib.Path(sys.argv[1])
allow_path = root / "scripts" / "cjk-allowlist.txt"
patterns = []
for raw in allow_path.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    patterns.append(line)

def allowed(rel):
    name = rel.rsplit("/", 1)[-1]
    for pattern in patterns:
        if pattern.endswith("/"):
            if rel.startswith(pattern):
                return True
        elif any(ch in pattern for ch in "*?["):
            if fnmatch.fnmatch(rel, pattern) or fnmatch.fnmatch(name, pattern):
                return True
        elif rel == pattern:
            return True
    return False

# Unified ideographs, extensions, compatibility, kana, hangul, fullwidth
# forms, and CJK punctuation.
cjk = re.compile(
    "["
    "\u3000-\u303f"
    "\u3040-\u30ff"
    "\u3400-\u4dbf"
    "\u4e00-\u9fff"
    "\uf900-\ufaff"
    "\uac00-\ud7af"
    "\uff00-\uffef"
    "]"
)
# Simplified Chinese label used by the English | label switch line.
label = "\u7b80\u4f53\u4e2d\u6587"
switch = re.compile(
    r"\[English\]\([^)]*\)\s*\|\s*\[" + re.escape(label) + r"\]\([^)]*\)"
    + r"|English\s*\|\s*" + re.escape(label)
)

files = subprocess.check_output(["git", "ls-files"], cwd=root, text=True).splitlines()
findings = []
for rel in files:
    if allowed(rel):
        continue
    path = root / rel
    if not path.is_file():
        continue
    data = path.read_bytes()
    if b"\0" in data:
        continue
    text = data.decode("utf-8", errors="replace")
    stripped = switch.sub("", text)
    if not cjk.search(stripped):
        continue
    for lineno, line in enumerate(stripped.splitlines(), 1):
        if cjk.search(line):
            findings.append(f"{rel}:{lineno}: {line.strip()[:180]}")
            break

if findings:
    print("CJK gate failed. CJK text is outside scripts/cjk-allowlist.txt.", file=sys.stderr)
    print("\n".join(findings), file=sys.stderr)
    sys.exit(1)

print("CJK gate passed.")
PY
