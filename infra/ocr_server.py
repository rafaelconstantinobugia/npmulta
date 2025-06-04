from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from paddleocr import PaddleOCR
import uvicorn
import time
import io
from typing import List, Dict, Any, Union

# Initialize PaddleOCR with angle detection
ocr = PaddleOCR(use_angle_cls=True, lang='en')  # Portuguese handled well by 'en' model
app = FastAPI(title="PaddleOCR API")

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(None), body: bytes = None):
    """
    Process image with PaddleOCR.
    Can accept either multipart form with file field or raw image bytes.
    """
    start_time = time.time()

    try:
        # Get image data - either from file upload or raw request body
        if file:
            img_bytes = await file.read()
        elif body:
            img_bytes = body
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "No image provided. Send either a file upload or raw image data."}
            )

        # Run OCR
        result = ocr.ocr(img_bytes, cls=True)
        
        # Process results
        items = []
        for line in result:
            for ((x1, y1, x2, y2), (text, confidence)) in line:
                items.append({
                    "text": text,
                    "confidence": float(confidence),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)]
                })
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "engine": "paddleocr", 
            "time_ms": processing_time, 
            "results": items
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error processing image: {str(e)}"}
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "engine": "paddleocr"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)