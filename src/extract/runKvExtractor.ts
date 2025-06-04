import { OcrItem } from '../types/ocr';

export interface TicketFields {
  plate?: { text: string; confidence: number };
  date?: { text: string; confidence: number };
  time?: { text: string; confidence: number };
  fine_amount?: { text: string; confidence: number };
  article?: { text: string; confidence: number };
}

/**
 * Runs LayoutLMv3-based key-value extraction on an image or OCR results
 * 
 * @param input Image as Uint8Array or object with OCR items
 * @param opts Options including AbortSignal for timeout
 * @returns Promise with extracted ticket fields
 */
export async function runKvExtractor(
  input: Uint8Array | { ocrItems: OcrItem[] },
  opts: { signal?: AbortSignal } = {}
): Promise<TicketFields> {
  // Create timeout controller (8s)
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 8000);
  
  // Combine user signal with timeout signal if provided
  const combinedSignal = opts.signal 
    ? { signal: AbortSignal.any([opts.signal, timeoutController.signal]) } 
    : { signal: timeoutController.signal };
  
  try {
    // Determine the extract API URL
    const apiUrl = import.meta.env.VITE_KV_EXTRACT_URL || 'https://' + window.location.host + '/.netlify/functions/kv-extract';
    
    let response: Response;
    
    // Prepare request based on input type
    if (input instanceof Uint8Array) {
      // Send image data directly
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: input,
        ...combinedSignal
      });
    } else {
      // Send OCR items
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ocrItems: input.ocrItems }),
        ...combinedSignal
      });
    }
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many concurrent extraction requests, please try again later');
      }
      
      // For 5xx errors, use the specific error message from the API response
      if (response.status >= 500) {
        const errorData = await response.json().catch(() => ({ error: 'layoutlm_gateway' }));
        throw new Error(errorData.error || 'layoutlm_gateway');
      }
      
      throw new Error(`Extraction API error (${response.status})`);
    }
    
    // Parse the response
    const result = await response.json() as TicketFields;
    
    return result;
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Extraction request timed out after 8s');
    }
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Helper function to normalize plate format
 * 
 * @param plate Raw plate text
 * @returns Normalized plate in XX-XX-XX format
 */
export function normalizePlate(plate: string): string {
  if (!plate) return '';
  
  // Remove spaces and convert to uppercase
  let normalized = plate.replace(/\s+/g, '').toUpperCase();
  
  // Check if it already has the correct format (XX-XX-XX)
  if (/^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(normalized)) {
    return normalized;
  }
  
  // Remove existing hyphens if any
  normalized = normalized.replace(/-/g, '');
  
  // If length is at least 6, format as XX-XX-XX
  if (normalized.length >= 6) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 4)}-${normalized.slice(4, 6)}`;
  }
  
  return normalized;
}

/**
 * Helper function to normalize date format
 * 
 * @param date Raw date text
 * @returns Normalized date in YYYY-MM-DD format if possible
 */
export function normalizeDate(date: string): string {
  if (!date) return '';
  
  // Remove spaces
  const normalized = date.replace(/\s+/g, '');
  
  // Try to parse different formats
  const formats = [
    // DD-MM-YYYY
    /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/,
    // DD-MM-YY
    /^(\d{1,2})[-./](\d{1,2})[-./](\d{2})$/
  ];
  
  for (const format of formats) {
    const match = normalized.match(format);
    if (match) {
      if (format === formats[0]) {
        // DD-MM-YYYY -> YYYY-MM-DD
        const [_, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (format === formats[1]) {
        // YYYY-MM-DD -> YYYY-MM-DD (already correct)
        const [_, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (format === formats[2]) {
        // DD-MM-YY -> YYYY-MM-DD
        const [_, day, month, shortYear] = match;
        const year = parseInt(shortYear) < 50 ? `20${shortYear}` : `19${shortYear}`;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return normalized;
}