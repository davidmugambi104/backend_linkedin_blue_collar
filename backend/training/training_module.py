#!/usr/bin/env python3
"""
Unified AI Training Module for WorkForge
Handles both Admin AI Responder and General AI Assistant training
"""

import argparse
import json
import hashlib
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrainingMode(Enum):
    ADMIN = "admin"  # For admin message responses
    ASSISTANT = "assistant"  # For general AI assistant
    UNIFIED = "unified"  # Combined training for both


@dataclass
class TrainingConfig:
    """Configuration for training runs"""
    mode: TrainingMode
    base_model: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    output_dir: Path = Path("training/output")
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-4
    max_length: int = 512
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    threshold: int = 25  # Minimum samples to trigger training
    
    def get_output_path(self) -> Path:
        """Get mode-specific output path"""
        suffix = {
            TrainingMode.ADMIN: "admin-support-lora",
            TrainingMode.ASSISTANT: "assistant-lora", 
            TrainingMode.UNIFIED: "unified-lora"
        }[self.mode]
        return self.output_dir / suffix


class DataValidator:
    """Validates training data quality"""
    
    MIN_PROMPT_LENGTH = 15
    MIN_RESPONSE_LENGTH = 30
    
    @staticmethod
    def validate(example: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate a single training example"""
        errors = []
        
        prompt = str(example.get("prompt", "")).strip()
        response = str(example.get("response", "")).strip()
        
        if not prompt:
            errors.append("empty_prompt")
        elif len(prompt) < DataValidator.MIN_PROMPT_LENGTH:
            errors.append(f"prompt_too_short ({len(prompt)} chars)")
            
        if not response:
            errors.append("empty_response")
        elif len(response) < DataValidator.MIN_RESPONSE_LENGTH:
            errors.append(f"response_too_short ({len(response)} chars)")
        
        # Check for PII patterns
        import re
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', prompt + response):
            errors.append("contains_email")
        if re.search(r'\b(?:\d{3}[-.]?){2}\d{4}\b', prompt + response):
            errors.append("contains_phone")
            
        return len(errors) == 0, errors


class TrainingDataManager:
    """Manages training data sources and merging"""
    
    def __init__(self, backend_root: Path):
        self.backend_root = backend_root
        self.data_dir = backend_root / "training" / "data"
        
    def get_data_sources(self, mode: TrainingMode) -> Dict[str, Path]:
        """Get relevant data sources for training mode"""
        sources = {
            "faq": self.data_dir / "faq_data.csv",
            "conversations": self.data_dir / "customer_conversations.jsonl",
            "admin_training": self.data_dir / "admin_training_data.jsonl",
            "assistant_training": self.data_dir / "assistant_training_data.jsonl",
            "disputes": self.data_dir / "dispute_staging.jsonl",
            "resolved_disputes": self.data_dir / "resolved_disputes.jsonl",
        }
        
        # Filter based on mode
        if mode == TrainingMode.ADMIN:
            return {k: v for k, v in sources.items() 
                   if k in ["admin_training", "disputes", "resolved_disputes", "conversations"]}
        elif mode == TrainingMode.ASSISTANT:
            return {k: v for k, v in sources.items() 
                   if k in ["faq", "conversations", "assistant_training"]}
        else:  # UNIFIED
            return sources
    
    def load_jsonl(self, path: Path) -> List[Dict[str, Any]]:
        """Load JSONL file"""
        if not path.exists():
            return []
        rows = []
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        rows.append(json.loads(line))
                    except json.JSONDecodeError:
                        logger.warning(f"Skipping invalid JSON line in {path}")
        return rows
    
    def load_csv_faq(self, path: Path) -> List[Dict[str, Any]]:
        """Load FAQ CSV and convert to training format"""
        import csv
        if not path.exists():
            return []
        rows = []
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('question') and row.get('answer'):
                    rows.append({
                        "prompt": row['question'],
                        "response": row['answer'],
                        "category": row.get('category', 'general'),
                        "source": "faq"
                    })
        return rows
    
    def deduplicate(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate training examples"""
        seen = set()
        unique = []
        for row in rows:
            # Create hash from prompt+response
            key = hashlib.sha256(
                f"{row.get('prompt', '')}::{row.get('response', '')}".encode()
            ).hexdigest()
            if key not in seen:
                seen.add(key)
                unique.append(row)
        return unique
    
    def merge_datasets(self, mode: TrainingMode) -> Tuple[List[Dict[str, Any]], int]:
        """Merge all relevant datasets for training mode"""
        sources = self.get_data_sources(mode)
        all_rows = []
        stats = {}
        
        for name, path in sources.items():
            if path.suffix == '.csv':
                rows = self.load_csv_faq(path)
            else:
                rows = self.load_jsonl(path)
            
            # Add source metadata
            for row in rows:
                row['_source'] = name
                
            stats[name] = len(rows)
            all_rows.extend(rows)
            logger.info(f"Loaded {len(rows)} examples from {name}")
        
        # Validate and filter
        valid_rows = []
        for row in all_rows:
            is_valid, errors = DataValidator.validate(row)
            if is_valid:
                valid_rows.append(row)
            else:
                logger.debug(f"Filtered invalid row: {errors}")
        
        # Deduplicate
        final_rows = self.deduplicate(valid_rows)
        
        logger.info(f"Merged dataset: {len(all_rows)} total, {len(valid_rows)} valid, {len(final_rows)} unique")
        return final_rows, len(final_rows)
    
    def save_training_dataset(self, rows: List[Dict[str, Any]], output_path: Path) -> None:
        """Save merged dataset to JSONL"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            for row in rows:
                # Clean internal fields
                clean_row = {k: v for k, v in row.items() if not k.startswith('_')}
                f.write(json.dumps(clean_row, ensure_ascii=False) + '\n')


class LoRATrainer:
    """Handles LoRA fine-tuning"""
    
    def __init__(self, config: TrainingConfig, backend_root: Path):
        self.config = config
        self.backend_root = backend_root
        self.data_manager = TrainingDataManager(backend_root)
        
    def prepare_dataset(self) -> Path:
        """Prepare and save training dataset"""
        rows, count = self.data_manager.merge_datasets(self.config.mode)
        
        if count < self.config.threshold:
            logger.warning(f"Insufficient data: {count} < {self.config.threshold} threshold")
            return None
        
        dataset_path = self.backend_root / "training" / "data" / f"merged_{self.config.mode.value}.jsonl"
        self.data_manager.save_training_dataset(rows, dataset_path)
        logger.info(f"Saved merged dataset to {dataset_path}")
        return dataset_path
    
    def train(self, dataset_path: Path) -> bool:
        """Run LoRA training"""
        output_dir = self.config.get_output_path()
        
        cmd = [
            sys.executable,
            str(self.backend_root / "training" / "train_lora.py"),
            "--dataset", str(dataset_path),
            "--output_dir", str(output_dir),
            "--base_model", self.config.base_model,
            "--epochs", str(self.config.epochs),
            "--batch_size", str(self.config.batch_size),
            "--learning_rate", str(self.config.learning_rate),
            "--max_length", str(self.config.max_length),
        ]
        
        logger.info(f"Starting training: {' '.join(cmd)}")
        try:
            subprocess.run(cmd, check=True)
            logger.info(f"Training complete. Model saved to {output_dir}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Training failed: {e}")
            return False
    
    def run(self) -> bool:
        """Full training pipeline"""
        dataset_path = self.prepare_dataset()
        if dataset_path is None:
            return False
        return self.train(dataset_path)


class ModelManager:
    """Manages model deployment and switching"""
    
    def __init__(self, backend_root: Path):
        self.backend_root = backend_root
        self.output_dir = backend_root / "training" / "output"
        
    def get_available_models(self) -> Dict[str, Path]:
        """List available trained models"""
        models = {}
        for mode in TrainingMode:
            model_path = self.output_dir / f"{mode.value}-lora"
            if model_path.exists():
                models[mode.value] = model_path
        return models
    
    def get_model_for_context(self, context: str) -> Optional[Path]:
        """Select appropriate model based on context"""
        context_lower = context.lower()
        
        # Admin-related contexts
        admin_keywords = ['admin', 'support', 'dispute', 'report', 'violation', 
                         'suspend', 'refund', 'billing', 'security', 'fraud']
        
        if any(kw in context_lower for kw in admin_keywords):
            admin_path = self.output_dir / "admin-support-lora"
            if admin_path.exists():
                return admin_path
        
        # Try unified model first (best of both worlds)
        unified_path = self.output_dir / "unified-lora"
        if unified_path.exists():
            return unified_path
        
        # Fall back to assistant model
        assistant_path = self.output_dir / "assistant-lora"
        if assistant_path.exists():
            return assistant_path
            
        return None
    
    def export_config(self) -> Dict[str, Any]:
        """Export current model configuration"""
        return {
            "available_models": {k: str(v) for k, v in self.get_available_models().items()},
            "recommended": {
                "admin_messaging": "admin-support-lora",
                "general_assistant": "unified-lora",
                "fallback": "assistant-lora"
            }
        }


def main():
    parser = argparse.ArgumentParser(
        description="Unified AI Training Module for WorkForge",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train admin responder model
  python training_module.py --mode admin
  
  # Train general assistant model  
  python training_module.py --mode assistant
  
  # Train unified model (recommended)
  python training_module.py --mode unified --epochs 5
  
  # Check available models
  python training_module.py --list-models
        """
    )
    
    parser.add_argument(
        "--mode", 
        choices=['admin', 'assistant', 'unified'],
        default='unified',
        help="Training mode (default: unified)"
    )
    parser.add_argument("--base-model", default="TinyLlama/TinyLlama-1.1B-Chat-v1.0")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--threshold", type=int, default=25)
    parser.add_argument("--list-models", action="store_true", help="List available trained models")
    parser.add_argument("--dry-run", action="store_true", help="Prepare dataset without training")
    
    args = parser.parse_args()
    
    backend_root = Path(__file__).resolve().parents[1]
    
    if args.list_models:
        manager = ModelManager(backend_root)
        config = manager.export_config()
        print(json.dumps(config, indent=2))
        return
    
    config = TrainingConfig(
        mode=TrainingMode(args.mode),
        base_model=args.base_model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        threshold=args.threshold
    )
    
    trainer = LoRATrainer(config, backend_root)
    
    if args.dry_run:
        dataset_path = trainer.prepare_dataset()
        if dataset_path:
            print(f"Dataset prepared: {dataset_path}")
        else:
            print("Insufficient data for training")
        return
    
    success = trainer.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
