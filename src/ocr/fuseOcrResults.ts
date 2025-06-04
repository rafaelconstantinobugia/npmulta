import { OcrItem, OcrResult } from '../types/ocr';

export interface FuseOptions {
  iouThreshold?: number;        // default 0.6
  bias?: Partial<Record<OcrItem['engine'], number>>; // weight multiplier
}

const DEFAULT_OPTIONS: Required<FuseOptions> = {
  iouThreshold: 0.6,
  bias: {
    tesseract: 1,
    paddle: 1.1
  }
};

/**
 * Calculates the Intersection over Union (IoU) of two bounding boxes
 * @param a First bounding box
 * @param b Second bounding box
 * @returns IoU value between 0 and 1
 */
function iou(a: OcrItem, b: OcrItem): number {
  const x0 = Math.max(a.bbox[0], b.bbox[0]);
  const y0 = Math.max(a.bbox[1], b.bbox[1]);
  const x1 = Math.min(a.bbox[2], b.bbox[2]);
  const y1 = Math.min(a.bbox[3], b.bbox[3]);
  const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  const areaA = (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]);
  const areaB = (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]);
  return inter / (areaA + areaB - inter);
}

/**
 * Calculates the harmonic mean of an array of numbers
 * @param values Array of values
 * @returns Harmonic mean
 */
function harmonicMean(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  // Calculate sum of reciprocals
  const sum = values.reduce((acc, val) => {
    // Handle zero values to avoid division by zero
    return acc + (val > 0 ? 1 / val : 0);
  }, 0);
  
  // If all values are zero, return zero
  if (sum === 0) return 0;
  
  return values.length / sum;
}

/**
 * Creates a union bounding box from multiple bounding boxes
 * @param items Array of OCR items
 * @returns Union bounding box [x0, y0, x1, y1]
 */
function unionBbox(items: OcrItem[]): [number, number, number, number] {
  return items.reduce(
    (acc, item) => [
      Math.min(acc[0], item.bbox[0]),
      Math.min(acc[1], item.bbox[1]),
      Math.max(acc[2], item.bbox[2]),
      Math.max(acc[3], item.bbox[3])
    ],
    [Infinity, Infinity, -Infinity, -Infinity]
  ) as [number, number, number, number];
}

/**
 * Fuses OCR results from multiple engines into a single, de-duplicated list
 * @param results Array of OCR results from different engines
 * @param options Fusion options
 * @returns Array of fused OCR items
 */
export function fuseOcrResults(
  results: OcrResult[],
  options?: FuseOptions
): OcrItem[] {
  // Apply default options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Short-circuit if only one engine returned results
  if (results.length === 0) {
    return [];
  }
  
  if (results.length === 1) {
    return results[0].items.map(item => ({
      ...item,
      confidence: Math.max(0, Math.min(1, item.confidence)) // Normalize confidence to 0-1
    }));
  }
  
  // Collect all items from every engine
  const allItems: OcrItem[] = results.flatMap(result => 
    result.items.map(item => ({
      ...item,
      // Apply engine-specific bias to confidence
      confidence: item.confidence * (opts.bias[item.engine] || 1)
    }))
  );
  
  if (allItems.length === 0) {
    return [];
  }
  
  // Create spatial grid for efficient lookup (10x10 grid)
  const gridSize = 100;
  const grid: Map<string, OcrItem[]> = new Map();
  
  // Add items to grid
  allItems.forEach(item => {
    // Calculate grid cells this item overlaps
    const minGridX = Math.floor(item.bbox[0] / gridSize);
    const minGridY = Math.floor(item.bbox[1] / gridSize);
    const maxGridX = Math.floor(item.bbox[2] / gridSize);
    const maxGridY = Math.floor(item.bbox[3] / gridSize);
    
    // Add item to all grid cells it overlaps
    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        const cellKey = `${x}-${y}`;
        const cell = grid.get(cellKey) || [];
        cell.push(item);
        grid.set(cellKey, cell);
      }
    }
  });
  
  // Track which items have been processed
  const processed = new Set<OcrItem>();
  const clusters: OcrItem[][] = [];
  
  // Cluster overlapping boxes
  allItems.forEach(item => {
    if (processed.has(item)) return;
    
    // Start a new cluster with this item
    const cluster: OcrItem[] = [item];
    processed.add(item);
    
    // Calculate grid cells this item overlaps
    const minGridX = Math.floor(item.bbox[0] / gridSize);
    const minGridY = Math.floor(item.bbox[1] / gridSize);
    const maxGridX = Math.floor(item.bbox[2] / gridSize);
    const maxGridY = Math.floor(item.bbox[3] / gridSize);
    
    // Get candidate items from overlapping grid cells
    const candidates = new Set<OcrItem>();
    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        const cellKey = `${x}-${y}`;
        const cellItems = grid.get(cellKey) || [];
        cellItems.forEach(candidate => {
          if (!processed.has(candidate) && candidate !== item) {
            candidates.add(candidate);
          }
        });
      }
    }
    
    // Check each candidate for overlap
    candidates.forEach(candidate => {
      if (iou(item, candidate) >= opts.iouThreshold) {
        cluster.push(candidate);
        processed.add(candidate);
      }
    });
    
    // Add the cluster to our list
    clusters.push(cluster);
  });
  
  // Process each cluster to create a fused item
  const fusedItems = clusters.map(cluster => {
    // Find the item with the highest confidence
    const bestItem = cluster.reduce((best, current) => 
      current.confidence > best.confidence ? current : best, cluster[0]);
    
    // Calculate harmonic mean of confidences
    const confidences = cluster.map(item => item.confidence);
    const meanConfidence = harmonicMean(confidences);
    
    // Create union bounding box
    const bbox = unionBbox(cluster);
    
    // Create fused item
    return {
      text: bestItem.text.trim(),
      confidence: meanConfidence,
      bbox,
      engine: `${bestItem.engine}_primary`
    };
  });
  
  // Sort items from top-left to bottom-right
  return fusedItems.sort((a, b) => {
    // First sort by y-coordinate (top to bottom)
    const yDiff = a.bbox[1] - b.bbox[1];
    if (Math.abs(yDiff) > 20) { // If items are on significantly different lines
      return yDiff;
    }
    // Then sort by x-coordinate (left to right)
    return a.bbox[0] - b.bbox[0];
  });
}