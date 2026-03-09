#!/usr/bin/env python3
import re
from typing import Any

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s\-()]{7,}\d)")
ID_PATTERN = re.compile(r"\b(?:id\s*number|national\s*id|passport\s*number|credit\s*card|cvv)\b", re.IGNORECASE)


def contains_sensitive_data(text: str) -> bool:
    return bool(EMAIL_PATTERN.search(text) or PHONE_PATTERN.search(text) or ID_PATTERN.search(text))


def validate_example(example: dict[str, Any], min_prompt_chars: int = 20, min_response_chars: int = 60) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    prompt = str(example.get("prompt", "")).strip()
    response = str(example.get("response", "")).strip()

    if not prompt:
        reasons.append("missing_prompt")
    if not response:
        reasons.append("missing_response")

    if prompt and len(prompt) < min_prompt_chars:
        reasons.append("prompt_too_short")
    if response and len(response) < min_response_chars:
        reasons.append("response_too_short")

    if contains_sensitive_data(prompt) or contains_sensitive_data(response):
        reasons.append("contains_sensitive_data")

    vague_markers = ["not sure", "i don't know", "cannot answer", "depends"]
    response_lower = response.lower()
    if any(marker in response_lower for marker in vague_markers):
        reasons.append("response_too_vague")

    return len(reasons) == 0, reasons
