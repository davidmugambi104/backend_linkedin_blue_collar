#!/usr/bin/env python3
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as file_obj:
        for line in file_obj:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file_obj:
        for row in rows:
            file_obj.write(json.dumps(row, ensure_ascii=False) + "\n")


def fingerprint(row: dict[str, Any]) -> str:
    payload = f"{row.get('prompt', '')}::{row.get('response', '')}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def dedupe_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for row in rows:
        key = fingerprint(row)
        if key in seen:
            continue
        seen.add(key)
        result.append(row)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Trigger LoRA training when staged disputes exceed threshold.")
    parser.add_argument("--staging", type=Path, default=Path("training/data/dispute_staging.jsonl"))
    parser.add_argument("--base_dataset", type=Path, default=Path("training/data/customer_conversations.jsonl"))
    parser.add_argument("--threshold", type=int, default=25)
    parser.add_argument("--train_script", type=Path, default=Path("training/train_lora.py"))
    parser.add_argument("--output_dir", type=Path, default=Path("training/output/customer-support-lora-auto"))
    parser.add_argument("--base_model", default="TinyLlama/TinyLlama-1.1B-Chat-v1.0")
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch_size", type=int, default=2)
    parser.add_argument("--learning_rate", type=float, default=2e-4)
    args = parser.parse_args()

    staged_rows = read_jsonl(args.staging)
    if len(staged_rows) < args.threshold:
        print(f"skip_training staged={len(staged_rows)} threshold={args.threshold}")
        return

    base_rows = read_jsonl(args.base_dataset)
    merged = dedupe_rows(base_rows + staged_rows)
    write_jsonl(args.base_dataset, merged)

    command = [
        "python",
        str(args.train_script),
        "--dataset",
        str(args.base_dataset),
        "--output_dir",
        str(args.output_dir),
        "--base_model",
        args.base_model,
        "--epochs",
        str(args.epochs),
        "--batch_size",
        str(args.batch_size),
        "--learning_rate",
        str(args.learning_rate),
    ]

    print("running:", " ".join(command))
    subprocess.check_call(command)

    write_jsonl(args.staging, [])
    print(f"training_complete merged_rows={len(merged)} staging_cleared=1")


if __name__ == "__main__":
    main()
