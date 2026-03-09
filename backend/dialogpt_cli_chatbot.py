#!/usr/bin/env python3
import importlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


def ensure_required_packages() -> None:
    required = {
        "torch": "torch",
        "transformers": "transformers",
    }

    missing = []
    for module_name, package_name in required.items():
        try:
            importlib.import_module(module_name)
        except ImportError:
            missing.append(package_name)

    if not missing:
        return

    print(f"Installing missing packages: {', '.join(missing)}")

    if "torch" in missing:
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "torch",
                "--index-url",
                "https://download.pytorch.org/whl/cpu",
            ]
        )
        missing = [package for package in missing if package != "torch"]

    if missing:
        subprocess.check_call([sys.executable, "-m", "pip", "install", *missing])


ensure_required_packages()

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


class DialoGPTCLI:
    def __init__(
        self,
        model_name: str = "microsoft/DialoGPT-small",
        history_file: Path | None = None,
        max_context_tokens: int = 900,
        max_new_tokens: int = 80,
    ) -> None:
        self.model_name = model_name
        self.history_file = history_file or Path(__file__).with_name("dialogpt_history.json")
        self.max_context_tokens = max_context_tokens
        self.max_new_tokens = max_new_tokens

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        print(f"Loading tokenizer and model: {self.model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            tie_word_embeddings=False,
        ).to(self.device)
        self.model.eval()

        self.history: list[dict[str, str]] = self._load_history()
        self.chat_history_ids: torch.Tensor | None = None
        if self.history:
            self.chat_history_ids = self._rebuild_context_from_history()

    def _load_history(self) -> list[dict[str, str]]:
        if not self.history_file.exists():
            return []

        try:
            data = json.loads(self.history_file.read_text(encoding="utf-8"))
            if isinstance(data, list):
                valid = []
                for item in data:
                    if isinstance(item, dict) and "user" in item and "bot" in item:
                        valid.append({"user": str(item["user"]), "bot": str(item["bot"])})
                return valid
        except (json.JSONDecodeError, OSError):
            pass

        return []

    def _save_history(self) -> None:
        self.history_file.write_text(json.dumps(self.history, ensure_ascii=False, indent=2), encoding="utf-8")

    def _encode(self, text: str) -> torch.Tensor:
        return self.tokenizer.encode(text + self.tokenizer.eos_token, return_tensors="pt").to(self.device)

    def _rebuild_context_from_history(self) -> torch.Tensor | None:
        context: torch.Tensor | None = None
        for turn in self.history:
            user_ids = self._encode(turn["user"])
            bot_ids = self._encode(turn["bot"])

            if context is None:
                context = torch.cat([user_ids, bot_ids], dim=-1)
            else:
                context = torch.cat([context, user_ids, bot_ids], dim=-1)

            if context.shape[-1] > self.max_context_tokens:
                context = context[:, -self.max_context_tokens :]
        return context

    def respond(self, user_text: str) -> str:
        new_user_input_ids = self._encode(user_text)

        if self.chat_history_ids is None:
            bot_input_ids = new_user_input_ids
        else:
            bot_input_ids = torch.cat([self.chat_history_ids, new_user_input_ids], dim=-1)

        if bot_input_ids.shape[-1] > self.max_context_tokens:
            bot_input_ids = bot_input_ids[:, -self.max_context_tokens :]

        attention_mask = torch.ones_like(bot_input_ids)

        with torch.no_grad():
            output_ids = self.model.generate(
                bot_input_ids,
                attention_mask=attention_mask,
                max_new_tokens=self.max_new_tokens,
                pad_token_id=self.tokenizer.eos_token_id,
                do_sample=True,
                top_k=50,
                top_p=0.92,
                temperature=0.75,
            )

        response_ids = output_ids[:, bot_input_ids.shape[-1] :]
        response_text = self.tokenizer.decode(response_ids[0], skip_special_tokens=True).strip()
        if not response_text:
            response_text = "I am not sure how to respond to that yet."

        self.chat_history_ids = output_ids[:, -self.max_context_tokens :]
        self.history.append({"user": user_text, "bot": response_text})
        self._save_history()

        return response_text


def run_chatbot() -> None:
    try:
        bot = DialoGPTCLI()
    except Exception as exc:
        print(f"Failed to initialize chatbot: {exc}")
        raise

    print("\nInteractive DialoGPT chatbot ready.")
    print("Type your message and press Enter. Type 'quit' to exit.\n")

    if bot.history:
        print(f"Loaded {len(bot.history)} previous turn(s) from {bot.history_file}.\n")

    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting chatbot.")
            break

        if user_text.lower() == "quit":
            print("Goodbye!")
            break

        if not user_text:
            continue

        try:
            response = bot.respond(user_text)
        except Exception as exc:
            print(f"Bot: Error while generating response: {exc}")
            continue

        print(f"Bot: {response}")


if __name__ == "__main__":
    run_chatbot()
