import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { DadosMulta } from '../types/multa';

/**
 * Generates a PDF letter for contesting a traffic ticket
 * @param dados The traffic ticket data
 * @returns A Promise that resolves to a Blob containing the PDF document
 */
export async function generateLetter(dados: DadosMulta): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  
  // Load the standard font
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const { width, height } = page.getSize();
  const margin = 50;
  const fontSize = 11;
  const lineHeight = fontSize * 1.5;
  
  // Add current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  page.drawText(formattedDate, {
    x: width - margin - 80,
    y: height - margin,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Add recipient details
  page.drawText('Exmo.(a) Sr.(a) Presidente', {
    x: margin,
    y: height - margin - lineHeight * 3,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Autoridade Nacional de Segurança Rodoviária', {
    x: margin,
    y: height - margin - lineHeight * 4,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Avenida da República, 16', {
    x: margin,
    y: height - margin - lineHeight * 5,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('1069-055 Lisboa', {
    x: margin,
    y: height - margin - lineHeight * 6,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Add subject
  page.drawText('Assunto: Defesa por Contraordenação Rodoviária', {
    x: margin,
    y: height - margin - lineHeight * 9,
    size: fontSize,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Add salutation
  page.drawText('Exmo.(a) Sr.(a) Presidente,', {
    x: margin,
    y: height - margin - lineHeight * 11,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Add letter content
  const letterContent = [
    `Eu, ${dados.nomeCondutor}, venho por este meio apresentar defesa relativa à contraordenação rodoviária alegadamente cometida no dia ${dados.data}, pelas ${dados.hora}, em ${dados.local}, com o veículo de matrícula ${dados.matricula}, pela suposta infração de "${dados.infracao}".`,
    '',
    'Após análise cuidadosa da notificação recebida, venho respeitosamente contestar esta alegada infração com base nos seguintes fundamentos:',
    '',
    '1. Insuficiência de prova fotográfica que comprove inequivocamente a infração alegada;',
    '',
    '2. Sinalização inadequada no local da infração, não cumprindo os requisitos legais estabelecidos pelo Código da Estrada, nomeadamente no que respeita à visibilidade, colocação e distância regulamentares;',
    '',
    '3. Ausência de comprovativo de calibração do aparelho de medição utilizado, conforme exigido pelo Decreto-Lei n.º 291/90, de 20 de Setembro e pela Portaria n.º 962/90, de 9 de Outubro;',
    '',
    'Face ao exposto, solicito o arquivamento do presente processo contraordenacional.',
    '',
    'Sem outro assunto de momento, apresento os meus melhores cumprimentos,'
  ];

  let y = height - margin - lineHeight * 13;
  for (const line of letterContent) {
    if (line === '') {
      y -= lineHeight;
      continue;
    }
    
    // Add text with automatic wrapping
    const words = line.split(' ');
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + word + ' ';
      const testWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > width - margin * 2) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim() !== '') {
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
  }
  
  // Add signature
  page.drawText(dados.nomeCondutor, {
    x: margin,
    y: y - lineHeight * 3,
    size: fontSize,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Convert to Blob
  return new Blob([pdfBytes], { type: 'application/pdf' });
}