import { describe, it, expect } from 'vitest';
import { generateLetter } from '../generateLetter';
import { PDFDocument } from 'pdf-lib';

describe('generateLetter', () => {
  const sampleData = {
    processNumber: '12345/2025',
    name: 'João Silva',
    plate: 'AA-12-BB',
    date: '2025-12-01',
    time: '14:30',
    location: 'Avenida da Liberdade, Lisboa',
    fineAmount: '60.00',
    autoDraftLaw: true,
  };

  it('generates a valid PDF', async () => {
    const pdfBytes = await generateLetter(sampleData);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
  });

  it('handles long content with multiple pages', async () => {
    const longData = {
      ...sampleData,
      customArguments: Array(50).fill('Lorem ipsum dolor sit amet.').join('\n'),
      autoDraftLaw: false,
    };

    const pdfBytes = await generateLetter(longData);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    expect(pdfDoc.getPageCount()).toBeGreaterThan(1);
  });

  it('includes optional fields when provided', async () => {
    const dataWithOptionals = {
      ...sampleData,
      article: 'Art. 145º',
      fineAmount: '120.00',
    };

    const pdfBytes = await generateLetter(dataWithOptionals);
    const text = Buffer.from(pdfBytes).toString('utf-8');
    
    expect(text).toContain('Art. 145º');
    expect(text).toContain('120,00');
  });
});