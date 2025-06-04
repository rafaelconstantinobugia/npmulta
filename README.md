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