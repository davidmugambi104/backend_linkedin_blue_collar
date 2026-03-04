#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BRANCH="main"
INTERVAL_SECONDS=60

while true; do
  cd "$REPO_ROOT"

  if [[ -d .git/rebase-apply || -d .git/rebase-merge || -f .git/MERGE_HEAD ]]; then
    sleep "$INTERVAL_SECONDS"
    continue
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    if ! git diff --cached --quiet; then
      timestamp=$(date +"%Y-%m-%d %H:%M:%S")
      git commit -m "Auto-save: ${timestamp}" >/dev/null 2>&1 || true
      git push origin "$BRANCH"
    fi
  fi

  sleep "$INTERVAL_SECONDS"
done
