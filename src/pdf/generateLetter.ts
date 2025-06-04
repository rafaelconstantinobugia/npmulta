import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { registerHelpers } from './helpers/handlebarsHelpers';

// Register Handlebars helpers
registerHelpers();

export interface LetterData {
  processNumber: string;
  name: string;
  plate: string;
  date: string;       // ISO 2025-06-04
  time: string;       // HH:mm
  location?: string;
  fineAmount?: string;
  article?: string;
  autoDraftLaw?: boolean;
  customArguments?: string;
  locale?: string;
}

let templateCache: { [key: string]: HandlebarsTemplateDelegate } = {};

async function loadTemplate(locale: string = 'pt'): Promise<HandlebarsTemplateDelegate> {
  if (templateCache[locale]) {
    return templateCache[locale];
  }

  // Load main template
  const templatePath = path.join(process.cwd(), 'templates', `letter.${locale}.hbs`);
  const template = await fs.readFile(templatePath, 'utf-8');

  // Load partials
  const partialsDir = path.join(process.cwd(), 'templates', 'partials');
  const partialFiles = await fs.readdir(partialsDir);

  for (const file of partialFiles) {
    if (file.endsWith('.hbs')) {
      const partialName = path.basename(file, '.hbs');
      const partialContent = await fs.readFile(path.join(partialsDir, file), 'utf-8');
      Handlebars.registerPartial(partialName, partialContent);
    }
  }

  const compiledTemplate = Handlebars.compile(template);
  templateCache[locale] = compiledTemplate;
  return compiledTemplate;
}

export async function generateLetter(data: LetterData): Promise<Uint8Array> {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSize = 12;
  const lineHeight = fontSize * 1.4;

  // Add first page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 70; // ~25mm

  // Load and compile template
  const template = await loadTemplate(data.locale);
  
  // Prepare template data
  const templateData = {
    ...data,
    currentDate: new Date().toISOString(),
  };

  // Generate letter content
  const content = template(templateData);
  
  // Split content into lines and draw
  const lines = content.split('\n');
  let y = height - margin;
  let currentPage = page;

  for (const line of lines) {
    if (y < margin + lineHeight) {
      // Add new page if needed
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }

    if (line.trim()) {
      currentPage.drawText(line.trim(), {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        lineHeight,
      });
    }
    y -= lineHeight;
  }

  // Generate PDF
  return pdfDoc.save();
}