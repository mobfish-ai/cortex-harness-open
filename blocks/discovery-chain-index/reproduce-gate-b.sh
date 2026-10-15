#!/usr/bin/env bash
# Copyright 2026 mobfish-ai
# SPDX-License-Identifier: Apache-2.0
# Gate B: reproduce the discovery-chain index Block from scratch on a clean machine.
# Usage: reproduce-gate-b.sh <git-url-or-local-repo-or-bundle> [ref]
# Host Node is used only when it is exactly v24.16.0. Otherwise a checksum-pinned
# private Node 24.16.0 is unpacked into the work directory (system Node is not changed).
# Set DCI_BOOTSTRAP_NODE=0 to refuse that download.
# Prints no environment, tokens, or process arguments.
set -euo pipefail
export GIT_TERMINAL_PROMPT=0
SRC="${1:?git url, local repository, or bundle path}"
REF="${2:-HEAD}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/dci-gate-b.XXXXXX")"
SERVER_PID=""
trap 'if [[ -n "${SERVER_PID}" ]]; then kill "${SERVER_PID}" 2>/dev/null || true; fi' EXIT
step() { printf 'STEP %-10s %s\n' "$1" "$2"; }
fail() { step "$1" "FAIL $2"; echo "GATE_B=FAIL"; exit 1; }

# Official nodejs.org SHASUMS256.txt for v24.16.0. The pin is the trust anchor.
expected_node_sha256() {
  case "$1" in
    linux-x64) printf '%s\n' '2faf6a387e9b62b888e21c54f01249fb27537ffecf1842f29f4c919d0a59a0ff' ;;
    linux-arm64) printf '%s\n' '589f5b6dd4fcfee4dfda73013903c966abaa8abd93dbc9d436544e472b4f0e74' ;;
    darwin-x64) printf '%s\n' '298b4c7b3cb80765c8703e42b90324a4ece3b6634947b89e769c3c980ab55185' ;;
    darwin-arm64) printf '%s\n' '39189dab4eeb15706c424af0ac08a3044c9e48f7db12a7d77f6b7aafc7dd5df6' ;;
    *) return 1 ;;
  esac
}

sha256_of() {
  local target="$1"
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$target" | awk '{print $1}'; return 0; fi
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$target" | awk '{print $1}'; return 0; fi
  if command -v openssl >/dev/null 2>&1; then openssl dgst -sha256 "$target" | awk '{print $NF}'; return 0; fi
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import hashlib,sys; print(hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest())' "$target"
    return 0
  fi
  return 1
}

download_file() {
  local url="$1" dest="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 -o "$dest" "$url"
    return 0
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -q -O "$dest" "$url"
    return 0
  fi
  return 1
}

clone_source() {
  local src="$1" ref="$2" dest="$3"
  local err="${WORK}/clone.err"
  # A local path must be cloned via file:// or git ignores --depth and warns.
  # Bundles reject shallow clones, so they are copied in full and then checked out.
  if [[ -f "$src" ]] && git bundle verify "$src" >/dev/null 2>>"$err"; then
    git clone -q "$src" "$dest" 2>>"$err" || return 1
    git -C "$dest" checkout -q "$ref" 2>>"$err" || return 1
    return 0
  fi
  local remote="$src"
  if [[ -d "$src" ]]; then
    remote="file://$(cd "$src" && pwd)"
  fi
  if git clone -q --depth 1 --branch "$ref" "$remote" "$dest" 2>>"$err"; then
    return 0
  fi
  rm -rf "$dest"
  git clone -q --branch "$ref" "$remote" "$dest" 2>>"$err" || return 1
}

command -v git >/dev/null 2>&1 || fail runtime "git is required"
host_bin="$(command -v node 2>/dev/null || true)"
host_ver="none"
if [[ -n "$host_bin" ]]; then
  host_ver="$("$host_bin" --version 2>/dev/null || echo broken)"
fi
if [[ "$host_ver" != "v24.16.0" ]]; then
  [[ "${DCI_BOOTSTRAP_NODE:-1}" != "0" ]] || fail runtime "node v24.16.0 required, found ${host_ver}"
  command -v tar >/dev/null 2>&1 || fail runtime "tar is required to unpack node"
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) arch=x64 ;;
    aarch64|arm64) arch=arm64 ;;
  esac
  platform="${os}-${arch}"
  want="$(expected_node_sha256 "$platform")" || fail runtime "unsupported platform ${platform}"
  tarball="node-v24.16.0-${platform}.tar.gz"
  download_file "https://nodejs.org/dist/v24.16.0/${tarball}" "$WORK/${tarball}" || fail runtime "node download failed"
  got="$(sha256_of "$WORK/${tarball}")" || fail runtime "no sha256 tool"
  [[ "$got" == "$want" ]] || fail runtime "checksum mismatch"
  tar -xzf "$WORK/${tarball}" -C "$WORK"
  prefix="$WORK/node-v24.16.0-${platform}"
  [[ -x "$prefix/bin/node" ]] || fail runtime "node binary missing after extract"
  export PATH="${prefix}/bin:${PATH}"
  hash -r 2>/dev/null || true
  step bootstrap "private node $(node --version) checksum ok"
fi
[[ "$(node --version 2>/dev/null || echo none)" == "v24.16.0" ]] || fail runtime "node v24.16.0 required"
step runtime "node $(node --version) $(uname -sm)"

clone_source "$SRC" "$REF" "$WORK/repo" || fail clone "ref not cloned"
cd "$WORK/repo" || fail clone "workdir missing"
step clone "$(git rev-parse HEAD)"

T="scripts/discovery-chain-index.mjs"
node --test --test-reporter=tap scripts/discovery-chain-index.test.mjs >"$WORK/test.log" 2>&1 || {
  tail -n 40 "$WORK/test.log" >&2 || true
  fail tests "node --test failed"
}
pass_n="$(awk '/^# pass / { print $3 }' "$WORK/test.log" | tail -n 1)"
fail_n="$(awk '/^# fail / { print $3 }' "$WORK/test.log" | tail -n 1)"
step tests "pass ${pass_n:-0} fail ${fail_n:-0}"

node "$T" elements >/dev/null || fail elements "seven elements incomplete"
step elements "7/7"

grep -q "Apache License" blocks/discovery-chain-index/LICENSE || fail license "LICENSE is not Apache-2.0"
grep -q "Version 2.0" blocks/discovery-chain-index/LICENSE || fail license "LICENSE is not Apache-2.0"
grep -q "Copyright 2026 mobfish-ai" blocks/discovery-chain-index/LICENSE || fail license "copyright is not mobfish-ai"
if grep -q "MIT License" blocks/discovery-chain-index/LICENSE; then fail license "MIT text remains"; fi
grep -q "mobfish-ai" blocks/discovery-chain-index/NOTICE || fail license "NOTICE missing"
node -e 'const b=JSON.parse(require("fs").readFileSync("blocks/discovery-chain-index/block.json","utf8")); if(b.license!=="Apache-2.0"||b.copyright!=="mobfish-ai"||b.publish!==false||b.publication!=="private_until_sanitization_audit") process.exit(1); const files=b.elements&&b.elements.license||[]; if(!files.includes("blocks/discovery-chain-index/NOTICE")) process.exit(1);' \
  || fail license "block metadata"
step license "Apache-2.0 mobfish-ai unpublished"

node "$T" build --skills blocks/discovery-chain-index/fixtures/skills --out "$WORK/v1" --version 1.0.0 >/dev/null || fail build v1
node "$T" verify --index "$WORK/v1" >/dev/null || fail verify v1
step build "v1 verified"

node "$T" update --from "$WORK/v1" --index "$WORK/live" >/dev/null || fail update "install v1"
tree_before="$(sha256_of "$WORK/live/index.json")" || fail consult "no sha256 tool"
node "$T" before-start --tree "$WORK/live" --task "email follow up" --heartbeat gate-b >"$WORK/consult.json" || fail consult "before-start failed"
tree_after="$(sha256_of "$WORK/live/index.json")" || fail consult "no sha256 tool"
[[ "$tree_before" == "$tree_after" ]] || fail consult "tree was written"
node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(!j.ok||j.phase!=="before_start"||j.heartbeat!=="gate-b"||j.trees_read!==1||j.results?.[0]?.skill!=="email-followup") process.exit(1);' "$WORK/consult.json" \
  || fail consult "relevant tree not read"
mkdir -p "$WORK/bad"
cp -a "$WORK/live/." "$WORK/bad/"
printf '\n' >> "$WORK/bad/index.json"
if node "$T" before-start --tree "$WORK/bad" --task "email follow up" --heartbeat gate-b >"$WORK/bad-consult.json"; then
  fail consult "unverified tree accepted"
fi
node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(j.ok||j.reason!=="TREE_UNVERIFIED"||(j.results||[]).length!==0) process.exit(1);' "$WORK/bad-consult.json" \
  || fail consult "unverified tree did not fail closed"
step consult "read before start; unverified tree rejected"

PORT="$(node -e 'const s=require("net").createServer(); s.listen(0,"127.0.0.1",()=>{process.stdout.write(String(s.address().port)); s.close();});')"
node "$T" serve --index "$WORK/live" --port "$PORT" >"$WORK/serve.log" 2>&1 &
SERVER_PID=$!
code=0
ready=0
i=0
while [[ "$i" -lt 25 ]]; do
  i=$((i + 1))
  code="$(node -e "fetch('http://127.0.0.1:${PORT}/healthz').then(r=>process.stdout.write(String(r.status))).catch(()=>process.stdout.write('0'))")"
  if [[ "$code" == "200" ]]; then ready=1; break; fi
  sleep 0.2
done
[[ "$ready" == "1" ]] || fail serve "healthz ${code}"
top="$(node -e "fetch('http://127.0.0.1:${PORT}/v1/search?q=email').then(r=>r.json()).then(j=>process.stdout.write(j.results[0]?.skill??'')).catch(()=>process.stdout.write(''))")"
[[ "$top" == "email-followup" ]] || fail query "top hit ${top}"
post="$(node -e "fetch('http://127.0.0.1:${PORT}/v1/search',{method:'POST'}).then(r=>process.stdout.write(String(r.status))).catch(()=>process.stdout.write('0'))")"
[[ "$post" == "405" ]] || fail readonly "POST ${post}"
step serve "healthz 200, search ok, POST 405"

sleep 1
node "$T" build --skills blocks/discovery-chain-index/fixtures/skills --out "$WORK/v2" --version 1.1.0 >/dev/null || fail build v2
node "$T" update --from "$WORK/v2" --index "$WORK/live" | grep -q '"updated": true' || fail update "v1->v2"
node "$T" rollback --index "$WORK/live" | grep -q '"version": "1.0.0"' || fail rollback "v2->v1"
step update "v1->v2 swapped, rollback to v1 ok"

if grep -rEq 'sk-[A-Za-z0-9]{16,}|password=[^ ]{8,}' "$WORK/live" "$WORK/v1" "$WORK/v2"; then fail secrets "secret-shaped text in output"; fi
step secrets "none in output"
echo "GATE_B=PASS"
