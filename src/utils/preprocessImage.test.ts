import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { preprocessImage } from './preprocessImage';

// Mock OpenCV
vi.mock('@u4/opencv.js', () => {
  // Create a mock implementation of the OpenCV functions we use
  const mockCv = {
    Mat: class {
      cols: number;
      rows: number;
      data: Uint8ClampedArray;
      size: Function;
      delete: Function;
      convertTo: Function;
      copyTo: Function;

      constructor(rows?: number, cols?: number, type?: number) {
        this.cols = cols || 100;
        this.rows = rows || 100;
        this.data = new Uint8ClampedArray(rows * cols * 4 || 400);
        this.size = () => ({ width: this.cols, height: this.rows });
        this.delete = vi.fn();
        this.convertTo = vi.fn();
        this.copyTo = vi.fn((dst) => {
          dst.cols = this.cols;
          dst.rows = this.rows;
          dst.data = this.data;
        });
      }
    },
    Point: class {
      constructor(x: number, y: number) {}
    },
    Size: class {
      constructor(width: number, height: number) {}
    },
    Scalar: class {
      constructor(r: number, g: number, b: number, a: number) {}
    },
    matFromImageData: vi.fn((imageData) => {
      return new mockCv.Mat(imageData.height, imageData.width);
    }),
    imdecode: vi.fn(() => {
      return new mockCv.Mat(100, 100);
    }),
    resize: vi.fn((src, dst, size) => {
      dst.cols = size.width;
      dst.rows = size.height;
      dst.data = new Uint8ClampedArray(size.width * size.height * 4);
    }),
    cvtColor: vi.fn((src, dst, code) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    bilateralFilter: vi.fn((src, dst, d, sigmaColor, sigmaSpace) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    adaptiveThreshold: vi.fn((src, dst, maxValue, adaptiveMethod, thresholdType, blockSize, c) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    getRotationMatrix2D: vi.fn(() => new mockCv.Mat()),
    warpAffine: vi.fn((src, dst, rotMat, size, flags, borderMode, borderValue) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    getStructuringElement: vi.fn(() => new mockCv.Mat()),
    morphologyEx: vi.fn((src, dst, op, kernel) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    Canny: vi.fn((src, dst, threshold1, threshold2) => {
      dst.cols = src.cols;
      dst.rows = src.rows;
      dst.data = src.data;
    }),
    HoughLines: vi.fn((src, dst, rho, theta, threshold) => {
      // Mock a rotated image with lines at 15 degrees
      dst.rows = 5;
      dst.data32F = new Float32Array(dst.rows * 2);
      // Set theta values to simulate 15 degree skew
      for (let i = 0; i < dst.rows; i++) {
        dst.data32F[i * 2] = 100; // rho
        dst.data32F[i * 2 + 1] = (105 * Math.PI) / 180; // theta (105 degrees = 15 degrees skew)
      }
    }),
    INTER_LINEAR: 1,
    INTER_AREA: 2,
    BORDER_CONSTANT: 0,
    COLOR_RGBA2GRAY: 11,
    COLOR_GRAY2RGBA: 8,
    ADAPTIVE_THRESH_MEAN_C: 1,
    THRESH_BINARY: 0,
    MORPH_CLOSE: 3,
    MORPH_RECT: 0,
    CV_8UC4: 24,
    IMREAD_COLOR: 1
  };

  return {
    __esModule: true,
    default: mockCv
  };
});

// Mock window for browser tests
vi.stubGlobal('window', {
  cv: null // Will be set in tests that need it
});

describe('preprocessImage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset mock OpenCV instance
    (window as any).cv = null;
  });

  it('should correct rotation when deskew is enabled and skew angle is detected', async () => {
    // Set up a mock image with skew
    const imageData = new ImageData(100, 100);
    
    // Import the real module (with our mocks applied)
    const result = await preprocessImage(imageData, { deskew: true });
    
    // Verify the image was processed and returned
    expect(result).toBeDefined();
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.data).toBeInstanceOf(Uint8ClampedArray);
  });

  it('should not apply deskew when the option is set to false', async () => {
    const imageData = new ImageData(100, 100);
    const result = await preprocessImage(imageData, { deskew: false });
    
    // Should still return processed image without deskew
    expect(result).toBeDefined();
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it('should resize images larger than maxSize', async () => {
    // Create a large image
    const imageData = new ImageData(4000, 3000);
    const maxSize = 2000;
    
    const result = await preprocessImage(imageData, { maxSize });
    
    // Check that the image was resized
    const expectedWidth = 2000;
    const expectedHeight = 1500;
    
    expect(result.width).toBe(expectedWidth);
    expect(result.height).toBe(expectedHeight);
  });

  it('should return original image if OpenCV initialization fails', async () => {
    // Ensure OpenCV is not available
    (window as any).cv = {
      onRuntimeInitialized: null
    };
    
    // Mock setTimeout to reject immediately
    vi.useFakeTimers();
    
    const imageData = new ImageData(100, 100);
    
    // Start the process, which should timeout
    const processPromise = preprocessImage(imageData);
    
    // Fast-forward time to trigger timeout
    vi.runAllTimers();
    vi.useRealTimers();
    
    const result = await processPromise;
    
    // Should return the original image
    expect(result.data).toBe(imageData.data);
    expect(result.width).toBe(imageData.width);
    expect(result.height).toBe(imageData.height);
  });
});