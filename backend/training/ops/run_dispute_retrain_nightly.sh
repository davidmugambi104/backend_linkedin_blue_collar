#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

VENV_PATH="${VENV_PATH:-$ROOT_DIR/.venv}"
PYTHON_BIN="$VENV_PATH/bin/python"
LOG_DIR="${LOG_DIR:-$BACKEND_DIR/training/logs}"

mkdir -p "$LOG_DIR"
cd "$BACKEND_DIR"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "[ERROR] Python not found at $PYTHON_BIN"
  echo "Set VENV_PATH env var to your virtualenv root (contains bin/python)."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$LOG_DIR/nightly_retrain_${STAMP}.log"

{
  echo "[INFO] Starting nightly dispute pipeline at $(date -Is)"

  if ! "$PYTHON_BIN" - <<'PY'
import importlib.util
import sys

required = ["datasets", "transformers", "peft"]
missing = [name for name in required if importlib.util.find_spec(name) is None]
if missing:
    print("[ERROR] Missing training dependencies:", ", ".join(missing))
    print("[ERROR] Install with: pip install -r backend/training/requirements.txt")
    sys.exit(1)
PY
  then
    exit 1
  fi

  "$PYTHON_BIN" "$BACKEND_DIR/training/auto_ingest_dispute.py" \
    --input "$BACKEND_DIR/training/data/resolved_disputes.jsonl" \
    --staging "$BACKEND_DIR/training/data/dispute_staging.jsonl" \
    --ledger "$BACKEND_DIR/training/data/dispute_ingest_ledger.json"

  "$PYTHON_BIN" "$BACKEND_DIR/training/train_if_threshold.py" \
    --staging "$BACKEND_DIR/training/data/dispute_staging.jsonl" \
    --base_dataset "$BACKEND_DIR/training/data/customer_conversations.jsonl" \
    --threshold "${TRAIN_THRESHOLD:-25}" \
    --output_dir "$BACKEND_DIR/training/output/customer-support-lora-auto"

  echo "[INFO] Nightly dispute pipeline completed at $(date -Is)"
} 2>&1 | tee "$LOG_FILE"
