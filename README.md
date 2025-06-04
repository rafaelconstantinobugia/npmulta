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