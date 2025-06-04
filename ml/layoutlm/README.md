# LayoutLMv3 for Structured Field Extraction

This module provides tools to fine-tune and use Microsoft's LayoutLMv3 model for extracting structured fields from traffic tickets and similar documents.

## Overview

The system uses [LayoutLMv3](https://huggingface.co/microsoft/layoutlmv3-base), a multimodal model that combines text, layout, and visual information to understand document structure. We fine-tune it to extract key fields from traffic tickets:

- License plate numbers
- Dates
- Times
- Fine amounts
- Article references

## Data Preparation

### Labeling in Doccano

1. Install [Doccano](https://github.com/doccano/doccano) or use their cloud service
2. Create a new Named Entity Recognition project
3. Define the following entity labels:
   - `plate` - License plate number
   - `date` - Infraction date
   - `time` - Infraction time
   - `amount` - Fine amount
   - `article` - Legal article reference

4. Upload your ticket images
5. Label the entities in each document
6. Export the annotations as JSONL

### Preparing the Dataset

Place your data in a structured directory:

```
data/labelled/
├── annotations.jsonl   # Doccano export
└── images/            # Image files
    ├── 0001.jpg
    ├── 0002.jpg
    └── ...
```

## Training

### Prerequisites

Install the required dependencies:

```bash
pip install transformers datasets torch pillow scikit-learn
```

### Running the Training

```bash
python ml/layoutlm/train.py --data data/labelled --out runs/lmv3
```

Options:
- `--data`: Directory containing annotations.jsonl and images folder
- `--out`: Output directory for trained model
- `--epochs`: Number of training epochs (default: 5)
- `--batch`: Batch size (default: 8) 
- `--lr`: Learning rate (default: 5e-5)
- `--push`: Push to HuggingFace Hub
- `--smoke`: Run quick smoke test (1 step)

### Smoke Testing

For a quick test on CPU:

```bash
python ml/layoutlm/train.py --data data/labelled --out runs/test --smoke
```

### Expected Performance

With ~50 annotated samples, expect:
- >90% F1 for license plates
- >85% F1 for dates and amounts
- >75% F1 for article references

## Deployment

The trained model is deployed in a Docker container running a FastAPI service.

Build and run:

```bash
docker build -t layoutlm -f infra/docker/LayoutLM.Dockerfile .
docker run -p 9100:9100 layoutlm
```

## Inference API

The API exposes a single endpoint:

```
POST /extract
```

It accepts:
- A PNG/JPEG/PDF file, or
- JSON with pre-extracted OCR data

Example call:

```bash
curl -X POST -F "file=@ticket.jpg" http://localhost:9100/extract
```

Example response:

```json
{
  "plate": {"text": "12-AB-34", "confidence": 0.92},
  "date": {"text": "2025-05-18", "confidence": 0.88},
  "time": {"text": "14:37", "confidence": 0.85},
  "fine_amount": {"text": "60,00 €", "confidence": 0.90},
  "article": {"text": "Art.º 145.º", "confidence": 0.77}
}
```

## Client Usage

From your application, use the `runKvExtractor` function to extract fields:

```typescript
import { runKvExtractor } from './extract/runKvExtractor';

// From image bytes
const imgBytes = new Uint8Array(...);
const fields = await runKvExtractor(imgBytes);

// Or from OCR items
const fields = await runKvExtractor({ ocrItems: ocrResults });

console.log(`Plate: ${fields.plate?.text} (confidence: ${fields.plate?.confidence})`);
```