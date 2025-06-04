import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuseOcrResults } from './fuseOcrResults';
import { OcrItem, OcrResult } from '../types/ocr';

describe('fuseOcrResults', () => {
  let tesseractResult: OcrResult;
  let paddleResult: OcrResult;
  
  beforeEach(() => {
    // Mock Tesseract result
    tesseractResult = {
      engine: 'tesseract',
      items: [],
      time_ms: 500
    };
    
    // Mock Paddle result
    paddleResult = {
      engine: 'paddle',
      items: [],
      time_ms: 300
    };
  });
  
  it('should return empty array for empty results', () => {
    const result = fuseOcrResults([]);
    expect(result).toEqual([]);
  });
  
  it('should return original items if only one engine returns results', () => {
    tesseractResult.items = [
      {
        text: 'Test',
        confidence: 0.85,
        bbox: [10, 20, 50, 40],
        engine: 'tesseract'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult]);
    expect(result.length).toBe(1);
    expect(result[0].text).toBe('Test');
    expect(result[0].confidence).toBe(0.85);
    expect(result[0].engine).toBe('tesseract');
  });
  
  it('should handle perfect overlap and calculate harmonic mean of confidence', () => {
    // Two engines recognize the same text in the same position
    tesseractResult.items = [
      {
        text: 'Hello',
        confidence: 0.8,
        bbox: [10, 20, 60, 40],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: 'Hello',
        confidence: 0.9,
        bbox: [10, 20, 60, 40],
        engine: 'paddle'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    
    // Expect single fused item
    expect(result.length).toBe(1);
    expect(result[0].text).toBe('Hello');
    expect(result[0].engine).toBe('paddle_primary'); // Paddle has higher confidence
    
    // Harmonic mean of 0.8 and 0.9 with paddle bias of 1.1
    // Adjusted confidences: 0.8 and 0.9*1.1 = 0.99
    // Harmonic mean calculation: 2 / (1/0.8 + 1/0.99) ≈ 0.886
    expect(result[0].confidence).toBeCloseTo(0.886, 2);
  });
  
  it('should choose text with higher confidence when bounding boxes overlap', () => {
    // Same position, different text
    tesseractResult.items = [
      {
        text: '12-AB-34',
        confidence: 0.9,
        bbox: [100, 200, 200, 230],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: '12-AR-34',
        confidence: 0.8,
        bbox: [100, 200, 200, 230],
        engine: 'paddle'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    
    expect(result.length).toBe(1);
    expect(result[0].text).toBe('12-AB-34'); // Tesseract has higher confidence
    expect(result[0].engine).toBe('tesseract_primary');
  });
  
  it('should not merge items with no overlap', () => {
    // Two different items with no overlap
    tesseractResult.items = [
      {
        text: 'Item 1',
        confidence: 0.7,
        bbox: [10, 20, 60, 40],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: 'Item 2',
        confidence: 0.8,
        bbox: [100, 200, 150, 220],
        engine: 'paddle'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    
    expect(result.length).toBe(2);
    expect(result[0].text).toBe('Item 1');
    expect(result[1].text).toBe('Item 2');
  });
  
  it('should apply engine bias when determining best text', () => {
    // Same position, different text, with engine bias favoring paddle
    tesseractResult.items = [
      {
        text: 'TesseractText',
        confidence: 0.85,
        bbox: [10, 20, 100, 40],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: 'PaddleText',
        confidence: 0.8, // Lower raw confidence
        bbox: [10, 20, 100, 40],
        engine: 'paddle'
      }
    ];
    
    // Paddle bias of 1.2 makes its effective confidence 0.8 * 1.2 = 0.96
    const result = fuseOcrResults([tesseractResult, paddleResult], {
      bias: { paddle: 1.2 }
    });
    
    expect(result.length).toBe(1);
    expect(result[0].text).toBe('PaddleText'); // Paddle wins due to bias
    expect(result[0].engine).toBe('paddle_primary');
  });
  
  it('should create union bounding box for overlapping items', () => {
    // Partially overlapping items
    tesseractResult.items = [
      {
        text: 'Overlap',
        confidence: 0.7,
        bbox: [10, 20, 60, 40],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: 'Test',
        confidence: 0.8,
        bbox: [30, 30, 80, 50],
        engine: 'paddle'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    
    expect(result.length).toBe(1);
    // Union bbox should be [10, 20, 80, 50]
    expect(result[0].bbox).toEqual([10, 20, 80, 50]);
  });
  
  it('should sort results from top-left to bottom-right', () => {
    // Multiple items at different positions
    tesseractResult.items = [
      {
        text: 'Bottom',
        confidence: 0.7,
        bbox: [50, 200, 100, 230],
        engine: 'tesseract'
      },
      {
        text: 'Right',
        confidence: 0.8,
        bbox: [150, 50, 200, 80],
        engine: 'tesseract'
      }
    ];
    
    paddleResult.items = [
      {
        text: 'Top',
        confidence: 0.75,
        bbox: [50, 50, 100, 80],
        engine: 'paddle'
      },
      {
        text: 'Left',
        confidence: 0.85,
        bbox: [10, 120, 60, 150],
        engine: 'paddle'
      }
    ];
    
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    
    expect(result.length).toBe(4);
    // Sort order: Top, Right, Left, Bottom (by y, then x)
    expect(result[0].text).toBe('Top');
    expect(result[1].text).toBe('Right');
    expect(result[2].text).toBe('Left');
    expect(result[3].text).toBe('Bottom');
  });
  
  it('should handle large number of items efficiently', () => {
    // Generate 2000 random items
    const items1: OcrItem[] = [];
    const items2: OcrItem[] = [];
    
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * 1000);
      const y = Math.floor(Math.random() * 1000);
      
      items1.push({
        text: `Item${i}`,
        confidence: Math.random(),
        bbox: [x, y, x + 50, y + 20],
        engine: 'tesseract'
      });
      
      items2.push({
        text: `Item${i + 1000}`,
        confidence: Math.random(),
        bbox: [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), x + 50, y + 20],
        engine: 'paddle'
      });
    }
    
    tesseractResult.items = items1;
    paddleResult.items = items2;
    
    const start = performance.now();
    const result = fuseOcrResults([tesseractResult, paddleResult]);
    const duration = performance.now() - start;
    
    // Check performance is under 50ms
    expect(duration).toBeLessThan(50);
    expect(result.length).toBeGreaterThan(0);
  });
});