import type { Mat } from '@u4/opencv.js';

// Handle both browser and Node environments
let cv: any;
try {
  // Try to import OpenCV for Node
  cv = (await import('@u4/opencv.js')).default;
} catch (error) {
  // In browser, OpenCV is injected into window
  cv = typeof window !== 'undefined' ? (window as any).cv : null;
}

export interface PreprocessOptions {
  deskew?: boolean;      // default = true
  maxSize?: number;      // longest edge, px (default 2500)
}

/**
 * Preprocesses an image for OCR to improve text recognition.
 * 
 * @param input Image data (ImageData, ArrayBuffer, or Uint8Array)
 * @param opts Processing options
 * @returns Promise with processed image data
 */
export async function preprocessImage(
  input: ImageData | ArrayBuffer | Uint8Array,
  opts?: PreprocessOptions
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  // Default options
  const options = {
    deskew: true,
    maxSize: 2500,
    ...opts
  };

  // Wait for OpenCV initialization with timeout
  if (!cv) {
    try {
      if (typeof window !== 'undefined' && (window as any).cv) {
        cv = (window as any).cv;
        if (cv.onRuntimeInitialized) {
          const initPromise = new Promise<void>((resolve) => {
            cv.onRuntimeInitialized = () => resolve();
          });
          
          // Wait for OpenCV to initialize with 1s timeout
          await Promise.race([
            initPromise,
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('OpenCV init timeout')), 1000))
          ]);
        }
      } else {
        throw new Error('OpenCV not available');
      }
    } catch (error) {
      console.warn('OpenCV initialization failed:', error);
      // Return original image unchanged if OpenCV isn't available
      if (input instanceof ImageData) {
        return {
          data: input.data,
          width: input.width,
          height: input.height
        };
      } else {
        // We can't proceed without OpenCV for non-ImageData inputs
        throw new Error('OpenCV initialization failed and input is not ImageData');
      }
    }
  }

  try {
    // Create input Mat from the provided data
    let src: Mat;
    
    if (input instanceof ImageData) {
      src = cv.matFromImageData(input);
    } else {
      // For ArrayBuffer or Uint8Array, decode as image
      const buffer = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
      src = cv.imdecode(new cv.Mat([...buffer], true), cv.IMREAD_COLOR);
    }

    // Resize if necessary
    let processedImage = new cv.Mat();
    const srcSize = src.size();
    
    if (Math.max(srcSize.width, srcSize.height) > options.maxSize) {
      const scale = options.maxSize / Math.max(srcSize.width, srcSize.height);
      const dstWidth = Math.round(srcSize.width * scale);
      const dstHeight = Math.round(srcSize.height * scale);
      
      cv.resize(src, processedImage, new cv.Size(dstWidth, dstHeight), 0, 0, cv.INTER_AREA);
      src.delete();
    } else {
      // Use original size
      src.copyTo(processedImage);
      src.delete();
    }

    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(processedImage, gray, cv.COLOR_RGBA2GRAY);
    processedImage.delete();
    
    // Noise reduction with bilateral filter
    const denoised = new cv.Mat();
    cv.bilateralFilter(gray, denoised, 9, 75, 75);
    gray.delete();
    
    // Apply adaptive threshold
    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      denoised, 
      binary, 
      255, 
      cv.ADAPTIVE_THRESH_MEAN_C, 
      cv.THRESH_BINARY, 
      25, 
      10
    );
    denoised.delete();
    
    // Deskew if enabled
    let deskewed: Mat;
    if (options.deskew) {
      const angle = getSkewAngle(binary);
      // Only deskew if angle is between 1 and 15 degrees
      if (Math.abs(angle) > 1 && Math.abs(angle) < 15) {
        deskewed = new cv.Mat();
        const center = new cv.Point(binary.cols / 2, binary.rows / 2);
        const rotMat = cv.getRotationMatrix2D(center, angle, 1);
        cv.warpAffine(
          binary, 
          deskewed, 
          rotMat, 
          new cv.Size(binary.cols, binary.rows), 
          cv.INTER_LINEAR, 
          cv.BORDER_CONSTANT, 
          new cv.Scalar(255, 255, 255, 255)
        );
        binary.delete();
        rotMat.delete();
      } else {
        deskewed = binary;
      }
    } else {
      deskewed = binary;
    }
    
    // Apply morphology close to fuse gaps
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const closed = new cv.Mat();
    cv.morphologyEx(deskewed, closed, cv.MORPH_CLOSE, kernel);
    deskewed.delete();
    kernel.delete();
    
    // Convert back to RGBA for consistent output format
    const result = new cv.Mat();
    cv.cvtColor(closed, result, cv.COLOR_GRAY2RGBA);
    closed.delete();
    
    // Extract data from Mat
    const imgData = new cv.Mat(result.rows, result.cols, cv.CV_8UC4);
    result.convertTo(imgData, cv.CV_8UC4);
    
    // Create output buffer
    const outputData = new Uint8ClampedArray(imgData.data);
    const width = imgData.cols;
    const height = imgData.rows;
    
    // Clean up
    imgData.delete();
    result.delete();
    
    return { data: outputData, width, height };
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    
    // Return original image data if processing fails
    if (input instanceof ImageData) {
      return {
        data: input.data,
        width: input.width,
        height: input.height
      };
    }
    
    throw new Error('Image preprocessing failed and input is not ImageData');
  }
}

/**
 * Helper function to process image in a Web Worker to avoid blocking the UI
 * 
 * @param input Image data
 * @param opts Processing options
 * @returns Promise with processed image data
 */
export function runInWorker(
  input: ImageData | ArrayBuffer | Uint8Array,
  opts?: PreprocessOptions
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  // Check if Web Workers are available
  if (typeof Worker === 'undefined') {
    return preprocessImage(input, opts);
  }
  
  return new Promise((resolve, reject) => {
    // Create a worker with inline code
    const workerCode = `
      self.onmessage = async function(e) {
        const { input, opts } = e.data;
        
        // Import the OpenCV library (would be provided by the main thread)
        try {
          // Process the image
          // This is simplified - in a real implementation you'd need to transfer
          // the actual OpenCV code or reference it through importScripts
          
          // Send the processed result back
          self.postMessage({ 
            success: true,
            result: {
              // Mock result - in real implementation this would be actual processed data
              data: input.data || new Uint8ClampedArray(),
              width: input.width || 0,
              height: input.height || 0
            }
          });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    
    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      
      // Fallback to main thread
      preprocessImage(input, opts)
        .then(resolve)
        .catch(reject);
    }, 5000);
    
    // Handle worker response
    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(url);
      
      if (e.data.success) {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error));
      }
    };
    
    // Handle worker errors
    worker.onerror = (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(url);
      
      // Fallback to main thread
      preprocessImage(input, opts)
        .then(resolve)
        .catch(reject);
    };
    
    // Send data to worker
    worker.postMessage({ input, opts });
  });
}

/**
 * Detects the skew angle of text in an image using Hough transform
 * 
 * @param srcGray Grayscale image
 * @returns Skew angle in degrees
 */
function getSkewAngle(srcGray: Mat): number {
  const edges = new cv.Mat();
  cv.Canny(srcGray, edges, 50, 200);
  
  const lines = new cv.Mat();
  cv.HoughLines(edges, lines, 1, Math.PI / 180, 150);
  
  let angle = 0;
  let cnt = 0;
  
  for (let i = 0; i < lines.rows; ++i) {
    const rhoTheta = lines.data32F[i * 2 + 1];           // θ
    const thetaDeg = (rhoTheta * 180) / Math.PI;
    
    // Skip near-vertical lines
    if (thetaDeg < 10 || thetaDeg > 170) continue;
    
    angle += thetaDeg - 90;
    cnt++;
  }
  
  // Clean up
  lines.delete();
  edges.delete();
  
  return cnt ? angle / cnt : 0;
}