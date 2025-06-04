import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runPaddleOCR, PaddleOcrResponse } from './runPaddleOCR';

// Mock fetch
const originalFetch = global.fetch;

describe('runPaddleOCR', () => {
  beforeEach(() => {
    // Mock environment variable
    vi.stubGlobal('import.meta', {
      env: {
        VITE_PADDLE_OCR_URL: 'http://test-paddle-ocr-url/ocr'
      }
    });
    
    // Reset timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  it('should process image and return OCR results', async () => {
    // Mock response
    const mockResponse: PaddleOcrResponse = {
      engine: 'paddleocr',
      time_ms: 150,
      results: [
        {
          text: '12-AB-34',
          confidence: 0.94,
          bbox: [100, 200, 200, 230]
        },
        {
          text: 'TEST TEXT',
          confidence: 0.87,
          bbox: [300, 400, 450, 430]
        }
      ]
    };
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    // Call the function
    const imgBuffer = new Uint8Array([1, 2, 3]);
    const result = await runPaddleOCR(imgBuffer);
    
    // Verify result
    expect(result).toEqual(mockResponse);
    expect(result.source).toBe('paddle');
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-paddle-ocr-url/ocr',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: imgBuffer
      })
    );
  });
  
  it('should throw error when request times out', async () => {
    // Mock fetch to never resolve
    global.fetch = vi.fn(() => new Promise((resolve) => {
      // This promise will never resolve, simulating a hanging request
    }));
    
    // Start the request
    const imgBuffer = new Uint8Array([1, 2, 3]);
    const resultPromise = runPaddleOCR(imgBuffer);
    
    // Advance timers to trigger timeout
    vi.advanceTimersByTime(11000);
    
    // Verify error is thrown
    await expect(resultPromise).rejects.toThrow('PaddleOCR request aborted');
  });
  
  it('should throw error for non-200 HTTP response', async () => {
    // Mock fetch to return error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502
    });
    
    // Call the function
    const imgBuffer = new Uint8Array([1, 2, 3]);
    
    // Verify error is thrown
    await expect(runPaddleOCR(imgBuffer)).rejects.toThrow('PaddleOCR gateway error (502)');
  });
  
  it('should respect user-provided AbortSignal', async () => {
    // Mock fetch that will take time to resolve
    global.fetch = vi.fn(() => new Promise((resolve) => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ engine: 'paddleocr', time_ms: 100, results: [] })
      }), 5000);
    }));
    
    // Create an AbortController
    const controller = new AbortController();
    const imgBuffer = new Uint8Array([1, 2, 3]);
    
    // Start the request
    const resultPromise = runPaddleOCR(imgBuffer, { signal: controller.signal });
    
    // Abort the request
    controller.abort();
    
    // Verify error is thrown
    await expect(resultPromise).rejects.toThrow('PaddleOCR request aborted');
  });
});