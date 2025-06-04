/**
 * Client for the PaddleOCR service
 */

export interface OcrItem {
  text: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface PaddleOcrResponse {
  engine: 'paddleocr';
  time_ms: number;
  results: OcrItem[];
}

/**
 * Run PaddleOCR on an image buffer
 * 
 * @param imgBuffer - Image data as Uint8Array
 * @param options - Optional parameters
 * @returns Promise with OCR results
 */
export async function runPaddleOCR(
  imgBuffer: Uint8Array,
  { signal }: { signal?: AbortSignal } = {}
): Promise<PaddleOcrResponse> {
  // Use environment variable or default to localhost during development
  const paddleOcrUrl = import.meta.env.VITE_PADDLE_OCR_URL || '/.netlify/functions/ocr-paddle';
  
  // Create an AbortController that will timeout after 10 seconds
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  
  // Combine the user-provided signal with our timeout signal
  const combinedSignal = signal 
    ? { signal: AbortSignal.any([signal, timeoutController.signal]) } 
    : { signal: timeoutController.signal };
  
  try {
    const response = await fetch(paddleOcrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: imgBuffer,
      ...combinedSignal
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`PaddleOCR gateway error (${response.status})`);
    }
    
    // Parse and validate the response
    const result = await response.json() as PaddleOcrResponse;
    
    // Check processing time
    if (result.time_ms > 10000) {
      throw new Error('PaddleOCR processing timeout (exceeded 10s)');
    }
    
    // Attach source metadata
    Object.defineProperty(result, 'source', {
      value: 'paddle',
      enumerable: true
    });
    
    return result;
  } catch (error) {
    // Clear the timeout in case of error
    clearTimeout(timeoutId);
    
    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PaddleOCR request aborted: timeout or user cancellation');
    }
    
    // Re-throw other errors
    throw error;
  }
}