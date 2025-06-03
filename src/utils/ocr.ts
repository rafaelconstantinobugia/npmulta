import * as Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from an image file using Tesseract OCR
 * @param imageFile The image file to process
 * @returns A Promise resolving to the extracted text
 */
async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    // Create a URL for the image file
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Process the image with Tesseract
    const result = await Tesseract.recognize(
      imageUrl,
      'por', // Portuguese language
      {
        logger: m => {
          console.log(m);
        }
      }
    );
    
    // Clean up the URL object
    URL.revokeObjectURL(imageUrl);
    
    // Return the recognized text
    return result.data.text;
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
        .map((item: any) => item.str)
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
      
      // Perform OCR on the image
      const result = await Tesseract.recognize(
        imageDataUrl,
        'por', // Portuguese language
        {
          logger: m => {
            console.log(m);
          }
        }
      );
      
      combinedText += result.data.text + '\n\n';
    }
    
    return combinedText;
  } catch (error) {
    console.error('Error extracting text from scanned PDF:', error);
    throw new Error('Falha ao processar o PDF digitalizado. Por favor, tente novamente com outro documento.');
  }
}

/**
 * Extracts specific data patterns from text
 * @param text The text to parse
 * @returns An object containing extracted data
 */
export function parseExtractedText(text: string) {
  // Initialize data structure
  const data = {
    matricula: '',
    data: '',
    local: '',
    infracao: '',
    hora: ''
  };
  
  // Extract license plate (matricula)
  // Portuguese license plates: 00-AA-00, AA-00-00, or 00-00-AA
  const matriculaRegex = /\b([A-Z0-9]{2}[-][A-Z0-9]{2}[-][A-Z0-9]{2})\b/gi;
  const matriculaMatch = text.match(matriculaRegex);
  if (matriculaMatch) {
    data.matricula = matriculaMatch[0];
  }
  
  // Extract date (data)
  // Common date formats: DD-MM-YYYY, DD/MM/YYYY
  const dateRegex = /\b(\d{2}[-/]\d{2}[-/]\d{4})\b/g;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    data.data = dateMatch[0];
  }
  
  // Extract time (hora)
  // Time format: HH:MM or HH.MM
  const timeRegex = /\b(\d{2}[:\.]\d{2})\b/g;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    data.hora = timeMatch[0];
  }
  
  // Look for location information
  // This is more complex and might require specific patterns or keywords
  const locationKeywords = ['local:', 'localização:', 'em:', 'na:', 'no:'];
  for (const keyword of locationKeywords) {
    const index = text.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      // Extract text after the keyword until the next period or newline
      const locationText = text.substring(index + keyword.length).split(/[.\n]/)[0].trim();
      if (locationText.length > 3) {
        data.local = locationText;
        break;
      }
    }
  }
  
  // Look for violation information
  // This is also complex and might require specific patterns or keywords
  const violationKeywords = ['infração:', 'contraordenação:', 'violação:'];
  for (const keyword of violationKeywords) {
    const index = text.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      // Extract text after the keyword until the next period or newline
      const violationText = text.substring(index + keyword.length).split(/[.\n]/)[0].trim();
      if (violationText.length > 3) {
        data.infracao = violationText;
        break;
      }
    }
  }
  
  return data;
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