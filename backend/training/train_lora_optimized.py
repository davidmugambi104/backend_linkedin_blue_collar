#!/usr/bin/env python3
"""
Memory-optimized LoRA training for WorkForge
Designed to run on systems with limited RAM
"""
import argparse
import json
import os
from pathlib import Path

from datasets import Dataset
from peft import LoraConfig, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


def load_jsonl(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as file_obj:
        for line in file_obj:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    if not rows:
        raise ValueError(f"No data found in {path}")
    return rows


def format_example(prompt: str, response: str) -> str:
    return f"<|user|>\n{prompt}\n<|assistant|>\n{response}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune a support model with LoRA (memory-optimized).")
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output_dir", type=Path, required=True)
    parser.add_argument("--base_model", default="TinyLlama/TinyLlama-1.1B-Chat-v1.0")
    parser.add_argument("--max_length", type=int, default=256)  # Reduced from 512
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch_size", type=int, default=1)  # Reduced from 2
    parser.add_argument("--learning_rate", type=float, default=2e-4)
    parser.add_argument("--lora_r", type=int, default=8)  # Reduced from 16
    parser.add_argument("--lora_alpha", type=int, default=16)  # Reduced from 32
    args = parser.parse_args()

    print(f"Loading dataset from {args.dataset}...")
    rows = load_jsonl(args.dataset)
    texts = [format_example(r["prompt"], r["response"]) for r in rows if r.get("prompt") and r.get("response")]
    if not texts:
        raise ValueError("Dataset has no valid prompt/response pairs")
    print(f"Loaded {len(texts)} training examples")

    print(f"Loading base model {args.base_model}...")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load model with memory optimizations
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        torch_dtype="auto",  # Use appropriate dtype
        low_cpu_mem_usage=True,
    )

    # Enable gradient checkpointing to save memory
    model.gradient_checkpointing_enable()

    print("Configuring LoRA...")
    peft_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "v_proj"],  # Reduced from 4 modules to 2
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    print("Preparing dataset...")
    dataset = Dataset.from_dict({"text": texts})

    def tokenize(batch):
        result = tokenizer(
            batch["text"],
            truncation=True,
            max_length=args.max_length,
            padding="max_length",
        )
        result["labels"] = result["input_ids"].copy()
        return result

    tokenized = dataset.map(tokenize, batched=True, remove_columns=["text"])

    # Memory-optimized training arguments
    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=8,  # Increased to maintain effective batch size
        learning_rate=args.learning_rate,
        logging_steps=5,
        save_strategy="epoch",
        report_to="none",
        fp16=False,
        bf16=False,
        dataloader_num_workers=0,  # Disable multiprocessing to save memory
        remove_unused_columns=False,
        # Memory optimizations
        optim="adamw_torch",
        # group_by_length=False,  # Not supported in this transformers version
    )

    print("Starting training...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )

    trainer.train()
    
    print(f"Saving model to {args.output_dir}...")
    model.save_pretrained(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"✓ Saved LoRA adapter and tokenizer to {args.output_dir}")


if __name__ == "__main__":
    main()
