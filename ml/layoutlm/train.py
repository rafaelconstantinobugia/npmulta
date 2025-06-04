#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Fine-tune LayoutLMv3 model for key-value extraction from traffic tickets.
"""

import os
import json
import argparse
import logging
from typing import Dict, List, Optional, Tuple, Union

import torch
from datasets import load_dataset, Features, Sequence, ClassLabel, Value, Array2D
from transformers import (
    LayoutLMv3ForTokenClassification, 
    LayoutLMv3Processor, 
    Trainer, 
    TrainingArguments,
    EarlyStoppingCallback
)
from transformers.trainer_utils import get_last_checkpoint
from sklearn.metrics import precision_recall_fscore_support, accuracy_score

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Define label mapping for named entity recognition
LABEL_MAP = {
    "O": 0,      # Outside of any entity
    "B-PLATE": 1,       # Beginning of license plate
    "I-PLATE": 2,       # Inside of license plate
    "B-DATE": 3,        # Beginning of date
    "I-DATE": 4,        # Inside of date
    "B-TIME": 5,        # Beginning of time
    "I-TIME": 6,        # Inside of time
    "B-AMOUNT": 7,      # Beginning of fine amount
    "I-AMOUNT": 8,      # Inside of fine amount
    "B-ARTICLE": 9,     # Beginning of article reference
    "I-ARTICLE": 10,    # Inside of article reference
}

ID2LABEL = {v: k for k, v in LABEL_MAP.items()}
LABEL2ID = LABEL_MAP


def convert_doccano_to_hf(doccano_file: str, images_dir: str) -> List[Dict]:
    """
    Convert Doccano JSON export to HuggingFace document VQA format.
    
    Args:
        doccano_file: Path to Doccano exported annotations.jsonl
        images_dir: Directory containing the images
        
    Returns:
        List of documents in HF format
    """
    documents = []
    
    with open(doccano_file, "r", encoding="utf-8") as f:
        for line in f:
            annotation = json.loads(line)
            
            # Get image path
            image_id = annotation["id"]
            image_filename = f"{image_id}.jpg"  # Adjust pattern if needed
            image_path = os.path.join(images_dir, image_filename)
            
            if not os.path.exists(image_path):
                # Try alternative extensions
                for ext in [".png", ".jpeg", ".pdf"]:
                    alt_path = os.path.join(images_dir, f"{image_id}{ext}")
                    if os.path.exists(alt_path):
                        image_path = alt_path
                        break
                else:
                    logger.warning(f"Image not found for ID {image_id}, skipping")
                    continue
            
            # Extract words and bounding boxes from OCR results (if provided)
            words = []
            bboxes = []
            labels = []
            
            # In Doccano format, relations might contain OCR info
            ocr_data = annotation.get("ocr_data", [])
            if ocr_data:
                for token in ocr_data:
                    words.append(token["text"])
                    # Convert bounding box to [x0, y0, x1, y1] format
                    x0, y0, x1, y1 = token["bbox"]
                    bboxes.append([x0, y0, x1, y1])
                    labels.append("O")  # Initially mark all as outside
            
            # Apply annotations to labels
            for entity in annotation.get("entities", []):
                entity_id = entity["id"]
                entity_type = entity["label"]
                start_offset = entity["start_offset"]
                end_offset = entity["end_offset"]
                
                # Map to corresponding tokens
                for i, token in enumerate(ocr_data):
                    token_start = token["offset"][0]
                    token_end = token["offset"][1]
                    
                    # Check if token overlaps with entity
                    if token_end <= start_offset or token_start >= end_offset:
                        continue
                    
                    # Determine if this is beginning or inside of entity
                    if token_start == start_offset or (token_start > start_offset and 
                                                      (i == 0 or labels[i-1] == "O")):
                        labels[i] = f"B-{entity_type.upper()}"
                    else:
                        labels[i] = f"I-{entity_type.upper()}"
            
            # Create document in HF format
            document = {
                "id": image_id,
                "image": image_path,
                "words": words,
                "bboxes": bboxes,
                "labels": labels
            }
            
            documents.append(document)
    
    return documents


def preprocess_data(documents: List[Dict], processor: LayoutLMv3Processor) -> Dict:
    """
    Preprocess documents using the LayoutLMv3 processor.
    
    Args:
        documents: List of documents in HF format
        processor: LayoutLMv3 processor
        
    Returns:
        Processed examples ready for training
    """
    processed_examples = []
    
    for doc in documents:
        # Load image
        image = processor.feature_extractor.read_image(doc["image"])
        
        # Process image and words to get input features
        encoding = processor(
            image, 
            doc["words"], 
            boxes=doc["bboxes"], 
            word_labels=doc["labels"],
            truncation=True, 
            padding="max_length",
            return_tensors="pt"
        )
        
        # Extract required fields
        processed_example = {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "bbox": encoding["bbox"].squeeze(),
            "pixel_values": encoding["pixel_values"].squeeze(),
            "labels": encoding["labels"].squeeze()
        }
        
        processed_examples.append(processed_example)
    
    return processed_examples


def compute_metrics(eval_pred):
    """
    Compute metrics for model evaluation.
    
    Args:
        eval_pred: Evaluation predictions
        
    Returns:
        Dict of metrics
    """
    predictions, labels = eval_pred
    predictions = predictions.argmax(axis=2)
    
    # Remove ignored index (special tokens)
    true_predictions = [
        [ID2LABEL[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [ID2LABEL[l] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    
    # Flatten the predictions and labels
    flat_predictions = [p for sublist in true_predictions for p in sublist]
    flat_labels = [l for sublist in true_labels for l in sublist]
    
    # Compute metrics
    precision, recall, f1, _ = precision_recall_fscore_support(
        flat_labels, flat_predictions, average="macro", labels=list(LABEL_MAP.keys())
    )
    accuracy = accuracy_score(flat_labels, flat_predictions)
    
    # Compute metrics per entity type
    entity_metrics = {}
    entity_types = ["PLATE", "DATE", "TIME", "AMOUNT", "ARTICLE"]
    
    for entity in entity_types:
        entity_labels = [1 if label.endswith(entity) else 0 for label in flat_labels]
        entity_preds = [1 if pred.endswith(entity) else 0 for pred in flat_predictions]
        
        # Skip if no instances of this entity
        if sum(entity_labels) == 0:
            continue
            
        p, r, f, _ = precision_recall_fscore_support(
            entity_labels, entity_preds, average="binary"
        )
        entity_metrics[f"{entity.lower()}_f1"] = f
        
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        **entity_metrics
    }


def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description="Fine-tune LayoutLMv3 for KV extraction")
    parser.add_argument("--data", type=str, required=True, help="Path to data directory with annotations.jsonl")
    parser.add_argument("--out", type=str, required=True, help="Output directory for trained model")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=5e-5, help="Learning rate")
    parser.add_argument("--push", action="store_true", help="Push to HuggingFace Hub")
    parser.add_argument("--smoke", action="store_true", help="Run quick smoke test (1 step)")
    
    args = parser.parse_args()
    
    # Check for checkpoint
    last_checkpoint = None
    if os.path.exists(args.out):
        last_checkpoint = get_last_checkpoint(args.out)
        if last_checkpoint:
            logger.info(f"Resuming from checkpoint: {last_checkpoint}")
    
    # Load processor and model
    processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base")
    
    # Create or load model
    if last_checkpoint:
        model = LayoutLMv3ForTokenClassification.from_pretrained(last_checkpoint)
    else:
        model = LayoutLMv3ForTokenClassification.from_pretrained(
            "microsoft/layoutlmv3-base",
            num_labels=len(LABEL_MAP),
            id2label=ID2LABEL,
            label2id=LABEL2ID
        )
    
    # Convert annotations to HF format
    doccano_file = os.path.join(args.data, "annotations.jsonl")
    images_dir = os.path.join(args.data, "images")
    
    # Check if files exist
    if not os.path.exists(doccano_file):
        logger.error(f"Doccano file not found: {doccano_file}")
        return
    
    if not os.path.exists(images_dir):
        logger.error(f"Images directory not found: {images_dir}")
        return
    
    logger.info(f"Converting Doccano annotations from {doccano_file}")
    documents = convert_doccano_to_hf(doccano_file, images_dir)
    logger.info(f"Converted {len(documents)} documents")
    
    # Split data into train/validation
    split_idx = int(len(documents) * 0.8)
    train_docs = documents[:split_idx]
    val_docs = documents[split_idx:]
    
    logger.info(f"Train: {len(train_docs)} documents, Val: {len(val_docs)} documents")
    
    # Preprocess data
    logger.info("Preprocessing data...")
    train_examples = preprocess_data(train_docs, processor)
    val_examples = preprocess_data(val_docs, processor)
    
    # Set up training arguments
    training_args = TrainingArguments(
        output_dir=args.out,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch,
        per_device_eval_batch_size=args.batch,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        push_to_hub=args.push,
        hub_model_id="npmulta/layoutlmv3-kv" if args.push else None,
        fp16=torch.cuda.is_available(),
        logging_dir=os.path.join(args.out, "logs"),
        logging_steps=10,
    )
    
    if args.smoke:
        logger.info("Running smoke test (1 step)")
        training_args.max_steps = 1
        training_args.eval_steps = 1
    
    # Create dataset dictionary
    dataset = {
        "train": train_examples,
        "validation": val_examples
    }
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
    )
    
    # Train model
    logger.info("Starting training...")
    trainer.train(resume_from_checkpoint=last_checkpoint)
    
    # Evaluate
    logger.info("Evaluating model...")
    eval_results = trainer.evaluate()
    logger.info(f"Evaluation results: {eval_results}")
    
    # Save model
    logger.info(f"Saving model to {args.out}")
    trainer.save_model(args.out)
    processor.save_pretrained(args.out)
    
    # Push to HuggingFace Hub if requested
    if args.push:
        logger.info("Pushing model to HuggingFace Hub")
        trainer.push_to_hub()
    
    logger.info("Training complete!")


if __name__ == "__main__":
    main()