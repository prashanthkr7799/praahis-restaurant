#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (scripts is one level deep)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="${SCRIPT_DIR%/scripts}"
cd "$PROJECT_ROOT"

# Prepare backup filename with timestamp and git short hash (if available)
ts=$(date +%Y%m%d-%H%M%S)
hash=$(git rev-parse --short HEAD 2>/dev/null || echo no-git)
mkdir -p backups
outfile="backups/tabun-${ts}-${hash}.tar.gz"

# Create archive excluding heavy/generated folders
# Note: leading ./ ensures exclude patterns match correctly
 tar -czf "$outfile" \
  --exclude='./backups' \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./.git' \
  ./

# Report result
size=$( (command -v gdu >/dev/null && gdu -h "$outfile" | awk '{print $1}') || (du -h "$outfile" | awk '{print $1}') )
echo "Backup created: $outfile ($size)"
