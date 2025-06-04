export interface OcrItem {
  text: string;                       // normalised UTF-8
  confidence: number;                 // 0‒1 (as provided by engine)
  bbox: [number, number, number, number]; // x0,y0,x1,y1
  engine: 'tesseract' | 'paddle' | string;
}

export interface OcrResult {          // one engine's output
  engine: OcrItem['engine'];
  items: OcrItem[];
  time_ms: number;
}