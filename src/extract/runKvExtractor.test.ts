import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runKvExtractor, normalizePlate, normalizeDate } from './runKvExtractor';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { OcrItem } from '../types/ocr';

// Mock server
const server = setupServer(
  // Success response
  rest.post('/.netlify/functions/kv-extract', (req, res, ctx) => {
    // Check if this is the cached request
    const cacheKey = req.headers.get('x-cache-key');
    if (cacheKey === 'cached-key') {
      return res(
        ctx.status(200),
        ctx.json({
          plate: { text: '12-AB-34', confidence: 0.92 },
          date: { text: '2025-05-18', confidence: 0.88 },
          time: { text: '14:37', confidence: 0.85 },
          fine_amount: { text: '60,00 €', confidence: 0.90 },
          article: { text: 'Art.º 145.º', confidence: 0.77 }
        }),
        ctx.set('X-Cache', 'HIT')
      );
    }
    
    // Simulate a delay for the first request to test timeout
    if (req.url.searchParams.get('delay') === 'true') {
      return res(
        ctx.delay(9000),
        ctx.status(200),
        ctx.json({})
      );
    }
    
    // Simulate 502 for missing model
    if (req.url.searchParams.get('missing') === 'true') {
      return res(
        ctx.status(502),
        ctx.json({ error: 'layoutlm_gateway' })
      );
    }
    
    // Default success response
    return res(
      ctx.status(200),
      ctx.json({
        plate: { text: '12-AB-34', confidence: 0.92 },
        date: { text: '2025-05-18', confidence: 0.88 },
        time: { text: '14:37', confidence: 0.85 },
        fine_amount: { text: '60,00 €', confidence: 0.90 },
        article: { text: 'Art.º 145.º', confidence: 0.77 }
      }),
      ctx.set('X-Cache', 'MISS')
    );
  })
);

// Setup and teardown
beforeEach(() => {
  // Start mock server
  server.listen();
  
  // Mock environment variable
  vi.stubGlobal('import.meta', {
    env: {
      VITE_KV_EXTRACT_URL: '/.netlify/functions/kv-extract'
    }
  });
  
  // Use fake timers
  vi.useFakeTimers();
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('runKvExtractor', () => {
  it('should extract fields from image data', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const result = await runKvExtractor(imageData);
    
    expect(result).toEqual({
      plate: { text: '12-AB-34', confidence: 0.92 },
      date: { text: '2025-05-18', confidence: 0.88 },
      time: { text: '14:37', confidence: 0.85 },
      fine_amount: { text: '60,00 €', confidence: 0.90 },
      article: { text: 'Art.º 145.º', confidence: 0.77 }
    });
  });
  
  it('should extract fields from OCR items', async () => {
    const ocrItems: OcrItem[] = [
      {
        text: '12-AB-34',
        confidence: 0.95,
        bbox: [100, 200, 200, 230],
        engine: 'tesseract'
      },
      {
        text: '18-05-2025',
        confidence: 0.90,
        bbox: [100, 250, 200, 280],
        engine: 'paddle'
      }
    ];
    
    const result = await runKvExtractor({ ocrItems });
    
    expect(result).toEqual({
      plate: { text: '12-AB-34', confidence: 0.92 },
      date: { text: '2025-05-18', confidence: 0.88 },
      time: { text: '14:37', confidence: 0.85 },
      fine_amount: { text: '60,00 €', confidence: 0.90 },
      article: { text: 'Art.º 145.º', confidence: 0.77 }
    });
  });
  
  it('should use cached results for the same request', async () => {
    // First request - cache miss
    await runKvExtractor(new Uint8Array([1, 2, 3, 4]));
    
    // Mock cached request
    server.use(
      rest.post('/.netlify/functions/kv-extract', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            plate: { text: 'CACHED', confidence: 1.0 },
            date: { text: '2025-01-01', confidence: 1.0 }
          }),
          ctx.set('X-Cache', 'HIT')
        );
      })
    );
    
    // Second request - should get cached result
    const cachedResult = await runKvExtractor(new Uint8Array([1, 2, 3, 4]));
    
    expect(cachedResult).toEqual({
      plate: { text: 'CACHED', confidence: 1.0 },
      date: { text: '2025-01-01', confidence: 1.0 }
    });
  });
  
  it('should timeout after 8 seconds', async () => {
    // Mock delayed response
    server.use(
      rest.post('/.netlify/functions/kv-extract', (req, res, ctx) => {
        return res(
          ctx.delay(10000),
          ctx.status(200),
          ctx.json({})
        );
      })
    );
    
    const promise = runKvExtractor(new Uint8Array([1, 2, 3, 4]));
    
    // Advance time to trigger timeout
    vi.advanceTimersByTime(9000);
    
    await expect(promise).rejects.toThrow('Extraction request timed out');
  });
  
  it('should handle missing model error', async () => {
    // Mock 502 response
    server.use(
      rest.post('/.netlify/functions/kv-extract', (req, res, ctx) => {
        return res(
          ctx.status(502),
          ctx.json({ error: 'layoutlm_gateway' })
        );
      })
    );
    
    await expect(runKvExtractor(new Uint8Array([1, 2, 3, 4])))
      .rejects.toThrow('layoutlm_gateway');
  });
});

describe('normalizePlate', () => {
  it('should format plate with correct format', () => {
    expect(normalizePlate('12-AB-34')).toBe('12-AB-34');
    expect(normalizePlate('12 AB 34')).toBe('12-AB-34');
    expect(normalizePlate('12AB34')).toBe('12-AB-34');
    expect(normalizePlate('12ab34')).toBe('12-AB-34');
    expect(normalizePlate('ab-12-34')).toBe('AB-12-34');
  });
  
  it('should handle invalid formats', () => {
    expect(normalizePlate('123456')).toBe('12-34-56');
    expect(normalizePlate('1234')).toBe('1234');
    expect(normalizePlate('')).toBe('');
  });
});

describe('normalizeDate', () => {
  it('should normalize dates to YYYY-MM-DD format', () => {
    expect(normalizeDate('18-05-2025')).toBe('2025-05-18');
    expect(normalizeDate('18/05/2025')).toBe('2025-05-18');
    expect(normalizeDate('18.05.2025')).toBe('2025-05-18');
    expect(normalizeDate('2025-05-18')).toBe('2025-05-18');
    expect(normalizeDate('18-05-25')).toBe('2025-05-18');
  });
  
  it('should handle invalid formats', () => {
    expect(normalizeDate('May 18, 2025')).toBe('May18,2025');
    expect(normalizeDate('')).toBe('');
  });
});