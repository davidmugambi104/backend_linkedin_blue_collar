#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path


def convert_csv_to_jsonl(input_path: Path, output_path: Path, prompt_col: str, response_col: str) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with input_path.open("r", encoding="utf-8", newline="") as csv_file, output_path.open("w", encoding="utf-8") as jsonl_file:
        reader = csv.DictReader(csv_file)
        if prompt_col not in reader.fieldnames or response_col not in reader.fieldnames:
            raise ValueError(
                f"CSV must contain columns '{prompt_col}' and '{response_col}'. Found: {reader.fieldnames}"
            )

        for row in reader:
            prompt = (row.get(prompt_col) or "").strip()
            response = (row.get(response_col) or "").strip()
            if not prompt or not response:
                continue
            jsonl_file.write(json.dumps({"prompt": prompt, "response": response}, ensure_ascii=False) + "\n")
            count += 1

    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert customer-support CSV into JSONL training format.")
    parser.add_argument("--input", type=Path, required=True, help="Input CSV path")
    parser.add_argument("--output", type=Path, required=True, help="Output JSONL path")
    parser.add_argument("--prompt_col", default="question", help="CSV prompt column name")
    parser.add_argument("--response_col", default="answer", help="CSV response column name")
    args = parser.parse_args()

    total = convert_csv_to_jsonl(args.input, args.output, args.prompt_col, args.response_col)
    print(f"Wrote {total} training examples to {args.output}")


if __name__ == "__main__":
    main()
