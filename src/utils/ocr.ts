import * as Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { parseMulta } from './parseMulta';
import { DadosMulta } from '../types/multa';

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getOcrWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await Tesseract.createWorker({
        logger: m => console.log(m)
      });
      await worker.loadLanguage('por');
      await worker.initialize('por');
      await worker.setParameters({
        tessedit_pageseg_mode: '6'
      });
      return worker;
    })();
  }
  return workerPromise;
}

async function preprocessImage(src: File | string): Promise<string> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (typeof src !== 'string') {
          URL.revokeObjectURL(url);
        }
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
      if (typeof src !== 'string') {
        URL.revokeObjectURL(url);
      }
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      if (typeof src !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Falha ao pré-processar a imagem.'));
    };
    img.src = url;
  });
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from an image file using Tesseract OCR
 * @param imageFile The image file to process
 * @returns A Promise resolving to the extracted text
 */
async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const worker = await getOcrWorker();

    // Preprocess the image to improve OCR results
    const processed = await preprocessImage(imageFile);

    const { data } = await worker.recognize(processed);

    return data.text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Falha ao extrair texto da imagem. Por favor, tente novamente com outra imagem.');
  }
}

/**
 * Extracts text from a PDF file
 * @param pdfFile The PDF file to process
 * @returns A Promise resolving to the extracted text
 */
async function extractTextFromPdf(pdfFile: File): Promise<string> {
  try {
    // Convert the file to an ArrayBuffer
    const fileBuffer = await pdfFile.arrayBuffer();
    
    // Load the PDF using pdf.js
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    
    let fullText = '';
    
    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items
      const pageText = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // If no text was extracted (likely a scanned PDF), try to extract images and perform OCR
    if (fullText.trim() === '') {
      fullText = await extractTextFromScannedPdf(fileBuffer);
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Falha ao extrair texto do PDF. Por favor, tente novamente com outro documento.');
  }
}

/**
 * Extracts text from a scanned PDF by rendering pages as images and performing OCR
 * @param pdfBuffer The PDF file as an ArrayBuffer
 * @returns A Promise resolving to the extracted text
 */
async function extractTextFromScannedPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    let combinedText = '';
    
    // Process each page
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      // Render the page to an image (as a data URL)
      const pdfLoadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdf = await pdfLoadingTask.promise;
      const page = await pdf.getPage(i + 1);
      
      // Scale the page to a reasonable size
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create a canvas to render the page
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      
      const worker = await getOcrWorker();

      const processed = await preprocessImage(imageDataUrl);

      const { data } = await worker.recognize(processed);

      combinedText += data.text + '\n\n';
    }
    
    return combinedText;
  } catch (error) {
    console.error('Error extracting text from scanned PDF:', error);
    throw new Error('Falha ao processar o PDF digitalizado. Por favor, tente novamente com outro documento.');
  }
}

/**
 * Parses extracted text to get structured data
 * @param text The text to parse
 * @returns An object containing extracted data
 */
export function parseExtractedText(text: string): Partial<DadosMulta> {
  return parseMulta(text);
}

/**
 * Extracts text from a file (PDF, JPG, PNG)
 * @param file The file to process
 * @returns A Promise resolving to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Check file size (max 10MB)
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`O ficheiro é demasiado grande. O tamanho máximo permitido é ${MAX_SIZE_MB}MB.`);
  }
  
  // Check file type
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Process based on file type
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  } else if (
    fileType.includes('image/jpeg') || 
    fileType.includes('image/jpg') || 
    fileType.includes('image/png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png')
  ) {
    return await extractTextFromImage(file);
  } else {
    throw new Error('Tipo de ficheiro não suportado. Por favor, carregue um ficheiro PDF, JPG ou PNG.');
  }
}
