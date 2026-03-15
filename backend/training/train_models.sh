#!/bin/bash
# Train WorkForge AI Models
# Usage: ./train_models.sh [mode] [options]

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRAINING_DIR="$BACKEND_DIR/training"
VENV_PATH="$BACKEND_DIR/../.venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}WorkForge AI Training Script${NC}"
echo "=============================="

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}Error: Virtual environment not found at $VENV_PATH${NC}"
    echo "Please create it first: python -m venv .venv"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_PATH/bin/activate"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}Python version: $PYTHON_VERSION${NC}"

# Install/update training dependencies
echo -e "${YELLOW}Installing training dependencies...${NC}"
pip install -q -r "$TRAINING_DIR/requirements.txt"

# Parse arguments
MODE="${1:-unified}"
EPOCHS="${2:-3}"
BATCH_SIZE="${3:-4}"

echo ""
echo -e "${GREEN}Training Configuration:${NC}"
echo "  Mode: $MODE"
echo "  Epochs: $EPOCHS"
echo "  Batch Size: $BATCH_SIZE"
echo ""

# Run training
cd "$BACKEND_DIR"
echo -e "${YELLOW}Starting training...${NC}"
python "$TRAINING_DIR/training_module.py" \
    --mode "$MODE" \
    --epochs "$EPOCHS" \
    --batch-size "$BATCH_SIZE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Training completed successfully!${NC}"
    echo ""
    echo "Available models:"
    python "$TRAINING_DIR/training_module.py" --list-models
else
    echo ""
    echo -e "${RED}✗ Training failed${NC}"
    exit 1
fi
