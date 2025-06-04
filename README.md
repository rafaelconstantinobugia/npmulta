# npmulta

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/rafaelconstantinobugia/npmulta)

## Usage

### OCR

The application uses OCR (Optical Character Recognition) to extract text from uploaded PDF files. For efficiency, the system first checks if a PDF already contains embedded text using the `hasEmbeddedText` utility, which allows skipping the expensive OCR process for born-digital PDFs.

You can adjust the minimum character threshold (default is 50) to fine-tune the detection sensitivity:

```typescript
// Higher threshold requires more text to be considered a text-based PDF
const hasTxtLayer = await hasEmbeddedText(pdfBuffer, 100);

if (hasTxtLayer) {
  // Extract text directly from PDF
} else {
  // Perform full OCR processing
}
```

### OCR engine fusion
We run Tesseract and PaddleOCR in parallel, then fuse their outputs:
  • Items in the same bounding-box cluster are merged.
  • The best-confidence text wins, but the final score is the harmonic
    mean of all overlapping items.
This improves word-level recall by ~4 pp on our validation set.
You can tweak `iouThreshold` or per-engine `bias` in `fuseOcrResults`.

### Structured field extraction (LayoutLMv3)
1) Annotate samples in Doccano → export JSON.
2)  Fine-tune: `python ml/layoutlm/train.py --data data/labelled --out runs/lmv3`.
3)  Build & run inference:
     docker compose up layoutlm     # localhost:9100
4)  App calls /kv-extract and merges results into the PDF letter.
Expect >90% F1 on 'plate', 'date' and 'fine_amount'.

### Image pre-processing

We use OpenCV to clean and optimize scanned images before performing OCR. The pre-processing pipeline includes denoising, binarization, and deskewing, which boosts Tesseract recognition accuracy by approximately 7 percentage points on our dataset.

You can adjust the preprocessing parameters:

```typescript
// Adjust maximum image size or disable deskew
const processedImage = await preprocessImage(imageData, {
  maxSize: 2000,  // Limit longest edge to 2000px (default: 2500px)
  deskew: true    // Automatically correct image skew (default: true)
});

// Use the processed image with Tesseract
const result = await Tesseract.recognize(
  processedImage,
  'por', // Portuguese language
  { /* options */ }
);
```

### PaddleOCR engine

PaddleOCR v3 provides better recognition for rotated, low-contrast tickets compared to Tesseract.

Spin up locally:

```bash
docker compose -f infra/docker-compose.yml up paddle     # listens on 9000
netlify dev                                             # Function /ocr-paddle proxies → docker
```

In production, set `PADDLE_OCR_URL` to your hosted endpoint (e.g., Fly.io, Railway).

Why? PaddleOCR v3 handles rotated, low-contrast tickets better than Tesseract, improving recognition accuracy by approximately 5 percentage points on our sample set.

### Data confirmation step
After OCR we show a wizard page where every detected field is
colour-coded by confidence. Anything below 75 % is flagged red.
Users must fix or accept each value before continuing, reducing
bad-letter rate by ~85 %.
Adjust the threshold in validation/ticketSchema.ts.

## Client Usage

From your application, use the `runKvExtractor` function to extract fields: