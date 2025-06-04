import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hasEmbeddedText } from './hasEmbeddedText';

// Mock PDF.js
vi.mock('pdfjs-dist', () => {
  return {
    getDocument: ({ data }) => {
      // Use the first byte of the ArrayBuffer to determine test case
      const testCase = new Uint8Array(data)[0];
      
      switch (testCase) {
        case 1: // Born-digital PDF with text
          return {
            promise: Promise.resolve({
              numPages: 1,
              getPage: () => Promise.resolve({
                getTextContent: () => Promise.resolve({
                  items: [{ str: 'A'.repeat(200) }]
                })
              })
            })
          };
        case 2: // Scanned PDF without text
          return {
            promise: Promise.resolve({
              numPages: 5,
              getPage: () => Promise.resolve({
                getTextContent: () => Promise.resolve({
                  items: []
                })
              })
            })
          };
        case 3: // Encrypted PDF
          return {
            promise: Promise.reject(new Error('Password required'))
          };
        case 4: // 10-page PDF for performance testing
          return {
            promise: Promise.resolve({
              numPages: 10,
              getPage: () => Promise.resolve({
                getTextContent: () => Promise.resolve({
                  items: [{ str: 'A'.repeat(25) }]
                })
              })
            })
          };
      }
    },
    GlobalWorkerOptions: { workerSrc: '' }
  };
});

describe('hasEmbeddedText', () => {
  let originalDateNow: () => number;
  
  beforeEach(() => {
    originalDateNow = Date.now;
  });
  
  afterEach(() => {
    Date.now = originalDateNow;
  });
  
  it('returns true for born-digital PDF with ≥200 chars', async () => {
    const pdfData = new ArrayBuffer(4);
    new Uint8Array(pdfData)[0] = 1;
    
    const result = await hasEmbeddedText(pdfData, 50);
    expect(result).toBe(true);
  });
  
  it('returns false for scanned-image PDF with no text', async () => {
    const pdfData = new ArrayBuffer(4);
    new Uint8Array(pdfData)[0] = 2;
    
    const result = await hasEmbeddedText(pdfData);
    expect(result).toBe(false);
  });
  
  it('returns false for encrypted PDF without password', async () => {
    const pdfData = new ArrayBuffer(4);
    new Uint8Array(pdfData)[0] = 3;
    
    const result = await hasEmbeddedText(pdfData);
    expect(result).toBe(false);
  });
  
  it('completes in under 3 seconds for a 10-page born-digital PDF', async () => {
    const pdfData = new ArrayBuffer(4);
    new Uint8Array(pdfData)[0] = 4;
    
    const start = Date.now();
    const result = await hasEmbeddedText(pdfData);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(3000);
    expect(result).toBe(true); // 10 pages × 25 chars = 250 chars
  });
  
  it('returns false if processing exceeds 3 seconds', async () => {
    const pdfData = new ArrayBuffer(4);
    new Uint8Array(pdfData)[0] = 4;
    
    // Mock Date.now to simulate time passing
    let callCount = 0;
    Date.now = vi.fn(() => {
      callCount++;
      return callCount > 1 ? originalDateNow() + 4000 : originalDateNow();
    });
    
    const result = await hasEmbeddedText(pdfData);
    expect(result).toBe(false);
  });
});