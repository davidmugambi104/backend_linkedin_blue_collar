# Customer Support Model Training (LoRA)

This folder contains a starter pipeline to fine-tune a customer-support assistant model on your data.

## What this creates
- `data/customer_conversations.example.jsonl`: training data format example
- `prepare_dataset.py`: convert a CSV into JSONL pairs
- `train_lora.py`: LoRA fine-tuning script (Transformers + PEFT)
- `infer.py`: test responses from your fine-tuned adapter

## 1) Install training dependencies
Use your backend venv:

```bash
source /home/davie/Documents/backend_linkedin_blue_collar/.venv/bin/activate
pip install -U transformers datasets peft accelerate evaluate sentencepiece
```

If you have an NVIDIA GPU and want 4-bit/8-bit:

```bash
pip install bitsandbytes
```

## 2) Prepare dataset
Expected JSONL format per line:

```json
{"prompt": "Customer message", "response": "Ideal support response"}
```

You can either:
- manually create `data/customer_conversations.jsonl`, or
- convert CSV with:

```bash
python training/prepare_dataset.py \
  --input training/faq_data.csv \
  --output training/data/customer_conversations.jsonl
```

## 3) Train LoRA adapter
Default base model is lightweight for easier local testing.

```bash
python training/train_lora.py \
  --dataset training/data/customer_conversations.jsonl \
  --output_dir training/output/customer-support-lora \
  --base_model TinyLlama/TinyLlama-1.1B-Chat-v1.0
```

## 4) Run inference
```bash
python training/infer.py \
  --base_model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \
  --adapter_dir training/output/customer-support-lora \
  --prompt "A customer says they were charged twice. How do we help?"
```

## Notes
- Start with RAG + policies first, then fine-tune for tone and workflow consistency.
- Redact personal data before training.
- Keep an evaluation split and compare before/after results.

## 5) Auto-ingest new disputes + retrain threshold

New scripts added:
- `quality_gate.py`: blocks short/vague or sensitive examples
- `auto_ingest_dispute.py`: ingests resolved cases into staging JSONL
- `train_if_threshold.py`: triggers training when staged examples reach threshold

### Resolved dispute input format

Use JSONL or CSV with at least:
- `dispute_id`
- `status` (`resolved`)
- `title`
- `summary`
- `resolution`
- `category`

### Ingest resolved disputes

```bash
python training/auto_ingest_dispute.py \
  --input training/data/resolved_disputes.jsonl \
  --staging training/data/dispute_staging.jsonl \
  --ledger training/data/dispute_ingest_ledger.json
```

### Trigger training only when enough new disputes are staged

```bash
python training/train_if_threshold.py \
  --staging training/data/dispute_staging.jsonl \
  --base_dataset training/data/customer_conversations.jsonl \
  --threshold 25 \
  --output_dir training/output/customer-support-lora-auto
```

Behavior:
- If staged rows are below threshold, training is skipped.
- If threshold is met, staged rows are merged + deduplicated into base dataset.
- Training runs and staging file is cleared after success.
