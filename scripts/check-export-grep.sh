#!/bin/sh
# Export grep gate. Banned spellings may appear only in ALLOWLIST.md and in
# this script. Every other tracked file must be clean.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "export grep gate requires a git checkout" >&2
  exit 1
fi

content=$(git grep -n -i -E \
  -e '/Users/klong/' \
  -e 'team_id' \
  -e '(^|[^A-Za-z0-9_-])reports/' \
  -e '(^|[^A-Za-z0-9_-])governance/' \
  -e 'reference-assets' \
  -e '(^|[^A-Za-z0-9_-])legacy/' \
  -e 'Mobfish Harness' \
  -e 'Codex Harness' \
  -e 'Airlock' \
  -e 'kelvinlong' \
  -e 'kelvin-obs-base' \
  -- . ':!ALLOWLIST.md' ':!scripts/check-export-grep.sh' || true)

paths=$(git ls-files | grep -E -i '(^|/)(reports|governance|legacy|reference-assets)(/|$)' || true)

if [ -n "$content" ] || [ -n "$paths" ]; then
  echo "Export grep gate failed." >&2
  if [ -n "$content" ]; then
    printf '%s\n' "$content" >&2
  fi
  if [ -n "$paths" ]; then
    printf '%s\n' "$paths" >&2
  fi
  exit 1
fi

echo "Export grep gate passed."
