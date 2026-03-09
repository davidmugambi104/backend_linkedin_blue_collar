#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path
from typing import Any

from quality_gate import validate_example


def load_ledger(path: Path) -> set[str]:
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return {str(item) for item in data}
    except json.JSONDecodeError:
        return set()
    return set()


def save_ledger(path: Path, values: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(sorted(values), ensure_ascii=False, indent=2), encoding="utf-8")


def load_resolved_cases(input_path: Path) -> list[dict[str, Any]]:
    if input_path.suffix.lower() == ".jsonl":
        items = []
        with input_path.open("r", encoding="utf-8") as file_obj:
            for line in file_obj:
                line = line.strip()
                if line:
                    items.append(json.loads(line))
        return items

    if input_path.suffix.lower() == ".csv":
        with input_path.open("r", encoding="utf-8", newline="") as file_obj:
            return list(csv.DictReader(file_obj))

    raise ValueError("Input must be .jsonl or .csv")


def build_training_example(case: dict[str, Any]) -> dict[str, str]:
    title = str(case.get("title", "")).strip()
    summary = str(case.get("summary", "")).strip()
    resolution = str(case.get("resolution", "")).strip()
    category = str(case.get("category", "general_dispute")).strip() or "general_dispute"

    prompt = f"Dispute: {title}\nContext: {summary}\nHow should support resolve this fairly for employer and worker?"
    response = f"Category: {category}\nResolution steps: {resolution}"

    return {"prompt": prompt, "response": response, "category": category}


def append_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as file_obj:
        for row in rows:
            file_obj.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest resolved disputes into staging training JSONL with quality gate.")
    parser.add_argument("--input", type=Path, required=True, help="Resolved disputes input (.jsonl or .csv)")
    parser.add_argument("--staging", type=Path, default=Path("training/data/dispute_staging.jsonl"))
    parser.add_argument("--ledger", type=Path, default=Path("training/data/dispute_ingest_ledger.json"))
    parser.add_argument("--id_field", default="dispute_id")
    parser.add_argument("--status_field", default="status")
    parser.add_argument("--resolved_value", default="resolved")
    args = parser.parse_args()

    rows = load_resolved_cases(args.input)
    ledger = load_ledger(args.ledger)

    accepted: list[dict[str, Any]] = []
    rejected = 0

    for item in rows:
        case_id = str(item.get(args.id_field, "")).strip()
        if not case_id:
            case_id = str(hash(json.dumps(item, sort_keys=True, ensure_ascii=False)))

        if case_id in ledger:
            continue

        status = str(item.get(args.status_field, "")).strip().lower()
        if status != args.resolved_value.lower():
            continue

        example = build_training_example(item)
        ok, reasons = validate_example(example)
        if ok:
            accepted.append(example)
            ledger.add(case_id)
        else:
            rejected += 1

    if accepted:
        append_jsonl(args.staging, accepted)
        save_ledger(args.ledger, ledger)

    print(f"accepted={len(accepted)} rejected={rejected} staging={args.staging}")


if __name__ == "__main__":
    main()
