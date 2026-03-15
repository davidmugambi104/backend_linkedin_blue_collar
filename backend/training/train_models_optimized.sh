#!/bin/bash
# Memory-optimized training script for WorkForge AI
# Usage: ./train_models_optimized.sh [mode] [epochs]

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRAINING_DIR="$BACKEND_DIR/training"
VENV_PATH="$BACKEND_DIR/../.venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}WorkForge AI Training Script (Memory-Optimized)${NC}"
echo "================================================"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}Error: Virtual environment not found${NC}"
    exit 1
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Parse arguments
MODE="${1:-unified}"
EPOCHS="${2:-2}"

echo ""
echo -e "${GREEN}Training Configuration:${NC}"
echo "  Mode: $MODE"
echo "  Epochs: $EPOCHS"
echo "  Batch Size: 1 (memory optimized)"
echo "  Max Length: 256 (memory optimized)"
echo "  LoRA Rank: 8 (memory optimized)"
echo ""

# Prepare dataset
cd "$BACKEND_DIR"
echo -e "${YELLOW}Preparing dataset...${NC}"
python "$TRAINING_DIR/training_module.py" --mode "$MODE" --dry-run

if [ $? -ne 0 ]; then
    echo -e "${RED}Dataset preparation failed${NC}"
    exit 1
fi

# Run optimized training
echo -e "${YELLOW}Starting optimized training...${NC}"
echo "This may take 10-30 minutes depending on your system."
echo ""

DATASET_PATH="$TRAINING_DIR/data/merged_${MODE}.jsonl"
OUTPUT_DIR="$TRAINING_DIR/output/${MODE}-lora"

python "$TRAINING_DIR/train_lora_optimized.py" \
    --dataset "$DATASET_PATH" \
    --output_dir "$OUTPUT_DIR" \
    --base_model "TinyLlama/TinyLlama-1.1B-Chat-v1.0" \
    --epochs "$EPOCHS" \
    --batch_size 1 \
    --max_length 256 \
    --lora_r 8 \
    --lora_alpha 16

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Training completed successfully!${NC}"
    echo ""
    echo "Model saved to: $OUTPUT_DIR"
    echo ""
    echo "To test the model:"
    echo "  python training/infer.py \\"
    echo "    --base_model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \\"
    echo "    --adapter_dir $OUTPUT_DIR \\"
    echo "    --prompt \"How do I verify my account?\""
else
    echo ""
    echo -e "${RED}✗ Training failed${NC}"
    exit 1
fi
