import '@testing-library/jest-dom';

// Mock analytics
global.analytics = {
  track: vi.fn()
} as any;