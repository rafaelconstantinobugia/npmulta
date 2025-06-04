from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
import io
import json
import logging
import time
from PIL import Image
from typing import Dict, List, Union, Optional, Any
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("layoutlm-server")

# Load model lazily
layoutlm_processor = None
layoutlm_model = None

# Create FastAPI app
app = FastAPI(title="LayoutLM Field Extractor")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_model():
    """Load LayoutLMv3 model and processor."""
    global layoutlm_processor, layoutlm_model
    
    if layoutlm_processor is None or layoutlm_model is None:
        start_time = time.time()
        logger.info("Loading LayoutLMv3 model...")
        
        try:
            # Get model ID from environment or use default
            model_id = os.environ.get("MODEL_ID", "npmulta/layoutlmv3-kv")
            
            # Import here to avoid loading transformers at startup
            from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
            
            # Load processor and model
            layoutlm_processor = LayoutLMv3Processor.from_pretrained(model_id)
            layoutlm_model = LayoutLMv3ForTokenClassification.from_pretrained(model_id)
            
            # Move model to GPU if available
            if torch.cuda.is_available():
                layoutlm_model = layoutlm_model.cuda()
            
            layoutlm_model.eval()
            
            load_time = time.time() - start_time
            logger.info(f"Model loaded in {load_time:.2f} seconds")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    # We'll load the model on the first request to avoid blocking startup
    pass


def process_image(image, ocr_data=None):
    """
    Process an image with LayoutLMv3 to extract key fields.
    
    Args:
        image: PIL Image
        ocr_data: Optional pre-extracted OCR data
        
    Returns:
        Dictionary of extracted fields with confidence scores
    """
    load_model()
    
    start_time = time.time()
    
    try:
        # If OCR data is provided, use it directly
        if ocr_data:
            words = [item["text"] for item in ocr_data]
            boxes = [item["bbox"] for item in ocr_data]
            
            # Normalize boxes if needed
            width, height = image.size
            normalized_boxes = []
            for box in boxes:
                x0, y0, x1, y1 = box
                # Ensure coordinates are within image bounds
                x0 = max(0, min(x0, width - 1))
                y0 = max(0, min(y0, height - 1))
                x1 = max(0, min(x1, width - 1))
                y1 = max(0, min(y1, height - 1))
                normalized_boxes.append([x0, y0, x1, y1])
        else:
            # We'd use OCR here, but for simplicity we'll just return an error
            raise HTTPException(
                status_code=400, 
                detail="Pre-extracted OCR data is required. Please provide OCR items."
            )
        
        # Process inputs
        encoding = layoutlm_processor(
            image, 
            words, 
            boxes=normalized_boxes,
            return_tensors="pt",
            truncation=True,
            padding="max_length"
        )
        
        # Move to GPU if available
        if torch.cuda.is_available():
            encoding = {k: v.cuda() for k, v in encoding.items()}
        
        # Run inference
        with torch.no_grad():
            outputs = layoutlm_model(**encoding)
        
        # Process outputs
        predictions = outputs.logits.argmax(-1).squeeze().cpu().numpy()
        token_ids = encoding["input_ids"].squeeze().cpu().numpy()
        attention_mask = encoding["attention_mask"].squeeze().cpu().numpy()
        
        # Get label map from model config
        id2label = layoutlm_model.config.id2label
        
        # Extract entities
        entities = {}
        current_entity = None
        current_text = []
        current_conf = []
        
        # Iterate through tokens
        for i, (pred, token_id, mask) in enumerate(zip(predictions, token_ids, attention_mask)):
            # Skip padding tokens
            if mask == 0 or token_id in layoutlm_processor.tokenizer.all_special_ids:
                continue
            
            # Get predicted label
            label = id2label[pred]
            
            # Handle entity boundaries
            if label.startswith("B-"):
                # If we were tracking an entity, finalize it
                if current_entity:
                    entity_type = current_entity.lower()
                    entity_text = " ".join(current_text)
                    entity_conf = np.mean(current_conf)
                    entities[entity_type] = {
                        "text": entity_text,
                        "confidence": float(entity_conf)
                    }
                
                # Start new entity
                current_entity = label[2:]  # Remove "B-"
                current_text = [words[i-1] if i-1 < len(words) else ""]
                current_conf = [float(outputs.logits[0, i, pred].item())]
            
            elif label.startswith("I-") and current_entity == label[2:]:
                # Continue current entity
                current_text.append(words[i-1] if i-1 < len(words) else "")
                current_conf.append(float(outputs.logits[0, i, pred].item()))
            
            elif current_entity:
                # Finalize current entity
                entity_type = current_entity.lower()
                entity_text = " ".join(current_text)
                entity_conf = np.mean(current_conf)
                entities[entity_type] = {
                    "text": entity_text,
                    "confidence": float(entity_conf)
                }
                current_entity = None
        
        # Handle final entity if needed
        if current_entity:
            entity_type = current_entity.lower()
            entity_text = " ".join(current_text)
            entity_conf = np.mean(current_conf)
            entities[entity_type] = {
                "text": entity_text,
                "confidence": float(entity_conf)
            }
        
        # Post-process fields
        if "plate" in entities:
            # Clean up plate format
            plate = entities["plate"]["text"]
            plate = plate.replace(" ", "").upper()
            # Format as XX-XX-XX if it looks like a plate
            if len(plate) >= 6:
                parts = []
                for i in range(0, len(plate), 2):
                    if i + 2 <= len(plate):
                        parts.append(plate[i:i+2])
                if len(parts) >= 3:
                    plate = "-".join(parts[:3])
            entities["plate"]["text"] = plate
        
        if "date" in entities:
            # Try to format as YYYY-MM-DD
            date = entities["date"]["text"]
            # Simple cleanup - more sophisticated parsing would be done here
            date = date.replace(" ", "").replace("/", "-").replace(".", "-")
            entities["date"]["text"] = date
        
        if "time" in entities:
            # Format as HH:MM
            time = entities["time"]["text"]
            time = time.replace(" ", "").replace(".", ":").replace("h", ":")
            if ":" not in time and len(time) >= 4:
                time = f"{time[:2]}:{time[2:4]}"
            entities["time"]["text"] = time
        
        if "amount" in entities:
            # Clean up amount format
            amount = entities["amount"]["text"]
            amount = amount.replace(" ", "")
            entities["amount"]["text"] = amount
        
        process_time = time.time() - start_time
        logger.info(f"Processed image in {process_time:.2f} seconds")
        
        # Return formatted results
        return {
            "plate": entities.get("plate"),
            "date": entities.get("date"),
            "time": entities.get("time"),
            "fine_amount": entities.get("amount"),
            "article": entities.get("article")
        }
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model": os.environ.get("MODEL_ID", "npmulta/layoutlmv3-kv")}


@app.post("/extract")
async def extract_fields(
    file: Optional[UploadFile] = File(None),
    ocr_items: Optional[List[Dict]] = None,
    body_data: Optional[Dict] = Body(None)
):
    """
    Extract structured fields from a document image.
    
    Accepts:
    - A file upload (image)
    - JSON with pre-extracted OCR data
    
    Returns:
    - Dictionary of extracted fields with confidence scores
    """
    start_time = time.time()
    
    try:
        # Get OCR items from body if provided
        if body_data and "ocrItems" in body_data:
            ocr_items = body_data["ocrItems"]
        
        # Get image from file upload
        if file:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        elif body_data and "imageData" in body_data:
            # Image data as base64
            import base64
            image_data = base64.b64decode(body_data["imageData"])
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        else:
            raise HTTPException(
                status_code=400,
                detail="Either a file upload or image data with OCR items must be provided"
            )
        
        # Process the image
        result = process_image(image, ocr_items)
        
        # Return the results
        return JSONResponse(
            content=result,
            headers={"X-Process-Time": f"{time.time() - start_time:.2f}s"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9100)