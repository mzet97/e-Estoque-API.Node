import { jest } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Setup test timeout
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Cleanup after all tests
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global test utilities
global.testTimeout = (timeout: number) => {
  jest.setTimeout(timeout);
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};