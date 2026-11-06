#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js 24 LTS (includes npm), reopen Terminal, then run this again."
  exit 1
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(!((a===20&&b>=19)||(a===22&&b>=12)||a>=24)){console.error("Use Node.js 24 LTS, 22.12+, or 20.19+.");process.exit(1)}'
npm ci --cache "$script_dir/.demo-npm-cache"
npm run dev -- --host 127.0.0.1
