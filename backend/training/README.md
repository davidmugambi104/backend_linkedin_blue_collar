# WorkForge AI Training Module

Bidirectional AI training system for WorkForge platform.
Supports both **Admin Message Responder** and **General AI Assistant** with unified training.

## Overview

This module provides:
- **Unified Training Pipeline**: Train models that work for both admin messaging and general assistant queries
- **Context-Aware Responses**: Automatically selects the best model based on query context
- **LoRA Fine-Tuning**: Efficient model customization with minimal resources
- **FAQ Fallback**: Reliable responses when models are unavailable
- **Auto-Retraining**: Trigger training when new dispute data reaches threshold

## Quick Start

### 1. Train All Models

```bash
cd backend/training
./train_models.sh unified 5 4
```

This trains a unified model with:
- 5 epochs
- Batch size of 4
- Combines admin, assistant, and dispute data

### 2. Train Specific Models

```bash
# Admin responder only
python training_module.py --mode admin --epochs 3

# General assistant only
python training_module.py --mode assistant --epochs 3

# Unified (recommended)
python training_module.py --mode unified --epochs 5
```

### 3. Check Available Models

```bash
python training_module.py --list-models
```

## Training Modes

### Admin Mode (`--mode admin`)
- Uses: `admin_training_data.jsonl`, `dispute_staging.jsonl`, `resolved_disputes.jsonl`
- Best for: Admin auto-replies to user messages
- Context: Professional, empathetic, solution-oriented

### Assistant Mode (`--mode assistant`)
- Uses: `faq_data.csv`, `customer_conversations.jsonl`
- Best for: General platform questions
- Context: Helpful, concise, informative

### Unified Mode (`--mode unified`) ⭐ Recommended
- Uses: All data sources combined
- Best for: Both admin and assistant use cases
- Context: Adaptive based on query type

## Data Sources

### FAQ Data (`faq_data.csv`)
Platform knowledge base with questions and answers.

### Admin Training Data (`data/admin_training_data.jsonl`)
Curated admin responses for common support scenarios:
- Account access issues
- Payment disputes
- Verification problems
- Safety reports
- Policy violations

### Customer Conversations (`data/customer_conversations.jsonl`)
Real conversation examples for training.

### Dispute Data (`data/resolved_disputes.jsonl`)
Resolved dispute cases for learning resolution patterns.

## Model Selection Logic

The system automatically selects the best model:

1. **Admin Keywords Detected** → Admin model (if available)
2. **Unified Model Available** → Unified model (best coverage)
3. **Assistant Model Available** → Assistant model
4. **None Available** → FAQ fallback

### Admin Keywords
- report, dispute, violation, suspend
- refund, billing, payment issue
- fraud, harassment, hack, security
- verify, verification failed

## API Usage

### Admin Auto-Reply (Messages)
```python
from app.services.admin_ai_responder import get_admin_ai_responder

responder = get_admin_ai_responder()
reply = responder.generate_reply(
    user_message="I can't access my account",
    history=[{"role": "user", "content": "Previous message"}]
)
```

### General Assistant
```python
from app.services.enhanced_ai_service import get_unified_ai_service, AIContext

service = get_unified_ai_service()
response = service.generate_response(
    query="How do I verify my identity?",
    context=AIContext.GENERAL
)
print(response.text)
print(response.suggested_actions)
```

### API Endpoints

#### Ask Assistant
```bash
POST /api/ai/ask
{
  "query": "How do I post a job?",
  "context": "general"  // optional: general, admin, dispute, onboarding
}
```

#### Get Suggestions
```bash
POST /api/ai/suggest
{
  "history": [{"role": "user", "content": "I have a problem"}],
  "current_text": "payment"
}
```

#### Check Status
```bash
GET /api/ai/status
```

## Configuration

### Environment Variables

```bash
# Base model for training
AI_BASE_MODEL=TinyLlama/TinyLlama-1.1B-Chat-v1.0

# Enable/disable features
AI_ADMIN_USE_LORA=true
AI_ADMIN_AUTO_REPLY_ENABLED=true

# Model paths (relative to backend root)
AI_ADMIN_ADAPTER_DIR=training/output/admin-support-lora
```

### Flask Config

```python
# config.py
AI_BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
AI_ADMIN_USE_LORA = True
AI_ADMIN_AUTO_REPLY_ENABLED = True
AI_ADMIN_MAX_NEW_TOKENS = 200
AI_ADMIN_TEMPERATURE = 0.7
```

## Auto-Retraining

### Manual Trigger
```bash
python training/train_if_threshold.py --threshold 25
```

### Nightly Cron
```bash
# Add to crontab
0 2 * * * /path/to/backend/training/ops/run_dispute_retrain_nightly.sh
```

### Systemd Timer
```bash
sudo cp training/ops/systemd/workforge-dispute-retrain.* /etc/systemd/system/
sudo systemctl enable --now workforge-dispute-retrain.timer
```

## File Structure

```
training/
├── training_module.py          # Main training orchestrator
├── train_lora.py                 # LoRA training script
├── prepare_dataset.py            # CSV to JSONL converter
├── auto_ingest_dispute.py       # Ingest resolved disputes
├── train_if_threshold.py         # Threshold-based retraining
├── quality_gate.py             # Data validation
├── infer.py                    # Manual inference test
├── train_models.sh             # Convenience training script
├── data/
│   ├── faq_data.csv            # Platform FAQ
│   ├── admin_training_data.jsonl   # Admin responses
│   ├── customer_conversations.jsonl
│   ├── resolved_disputes.jsonl
│   └── dispute_staging.jsonl
└── output/
    ├── admin-support-lora/     # Admin model
    ├── assistant-lora/         # Assistant model
    └── unified-lora/           # Combined model
```

## Testing Inference

```bash
# Test admin model
python training/infer.py \
    --base_model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \
    --adapter_dir training/output/admin-support-lora \
    --prompt "User: I was charged twice. Help!"

# Test unified model
python training/infer.py \
    --base_model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \
    --adapter_dir training/output/unified-lora \
    --prompt "How do I verify my account?"
```

## Troubleshooting

### Model Not Found
- Check if training completed: `python training_module.py --list-models`
- Verify paths in config match actual output directories

### Low Quality Responses
- Increase training epochs: `--epochs 5`
- Add more training data to relevant JSONL files
- Check data quality with: `python training_module.py --dry-run`

### Out of Memory
- Reduce batch size: `--batch-size 2`
- Use smaller base model
- Enable gradient checkpointing (modify train_lora.py)

### Import Errors
```bash
# Ensure dependencies are installed
pip install -r training/requirements.txt
```

## Performance Tips

1. **Use Unified Model**: Single model handles both use cases efficiently
2. **Preload Models**: Load at startup to avoid first-request latency
3. **Cache Responses**: Cache FAQ results for common queries
4. **Monitor Confidence**: Log confidence scores to identify weak areas

## Contributing

To add new training data:

1. **Admin Responses**: Add to `data/admin_training_data.jsonl`
2. **FAQ Entries**: Add to `faq_data.csv`
3. **Dispute Cases**: Use `auto_ingest_dispute.py` to ingest resolved cases
4. **Retrain**: Run `train_models.sh unified` to update models

## License

Internal WorkForge project.
