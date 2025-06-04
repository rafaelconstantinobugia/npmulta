import '@testing-library/jest-dom';

// Mock analytics
vi.mock('../utils/analytics', () => ({
  track: vi.fn()
}));