import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock Redis
export const mockRedis = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
  hset: jest.fn(),
  hget: jest.fn(),
  hgetall: jest.fn(),
  hdel: jest.fn(),
  lpush: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  zadd: jest.fn(),
  zrange: jest.fn(),
  zscore: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
  flushall: jest.fn().mockResolvedValue('OK'),
  quit: jest.fn().mockResolvedValue('OK'),
};

// Mock RabbitMQ
export const mockRabbitMQ = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  createChannel: jest.fn(),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
  assertExchange: jest.fn().mockResolvedValue({ exchange: 'test-exchange' }),
  publish: jest.fn(),
  consume: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn(),
  prefetch: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock HTTP/HTTPS
export const mockHttpRequest = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
};

// Mock File System
export const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  rmdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn(),
};

// Mock Email Service
export const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBulkEmail: jest.fn().mockResolvedValue([{ messageId: 'test-message-id-1' }]),
  validateEmail: jest.fn().mockReturnValue(true),
};

// Mock File Storage Service
export const mockFileStorage = {
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://test-bucket.s3.amazonaws.com/test-file.pdf' }),
  deleteFile: jest.fn().mockResolvedValue(true),
  getFileUrl: jest.fn().mockReturnValue('https://test-bucket.s3.amazonaws.com/test-file.pdf'),
  downloadFile: jest.fn().mockResolvedValue(Buffer.from('test file content')),
};

// Mock Metrics Service
export const mockMetrics = {
  incrementCounter: jest.fn(),
  gaugeHistogram: jest.fn(),
  recordTimer: jest.fn(),
  recordGauge: jest.fn(),
  recordCounter: jest.fn(),
};

// Test Data Factories
export class TestDataFactory {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: 'user-test-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createProduct(overrides: Partial<any> = {}) {
    return {
      id: 'product-test-123',
      name: 'Test Product',
      description: 'Test product description',
      price: 100.00,
      sku: 'TEST-001',
      stockQuantity: 50,
      categoryId: 'cat-test-123',
      isActive: true,
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createOrder(overrides: Partial<any> = {}) {
    return {
      id: 'order-test-123',
      userId: 'user-test-123',
      status: 'pending',
      totalAmount: 200.00,
      items: [
        {
          productId: 'product-test-123',
          quantity: 2,
          price: 100.00,
        },
      ],
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createInventory(overrides: Partial<any> = {}) {
    return {
      id: 'inventory-test-123',
      productId: 'product-test-123',
      currentStock: 50,
      reservedStock: 5,
      minimumStock: 10,
      maximumStock: 100,
      lastRestockedAt: new Date(),
      ...overrides,
    };
  }

  static createApiRequest(overrides: Partial<any> = {}) {
    return {
      method: 'GET',
      url: '/api/test',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        ...overrides.headers,
      },
      body: {},
      params: {},
      query: {},
      ...overrides,
    };
  }

  static createApiResponse(overrides: Partial<any> = {}) {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      ...overrides,
    };
  }
}

// Event Bus Mock
export const mockEventBus = new EventEmitter();

// Async utilities
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockRequest(overrides: any = {}) {
  return {
    method: 'GET',
    url: '/test',
    headers: {},
    params: {},
    query: {},
    body: {},
    user: { id: 'test-user', role: 'user' },
    ...overrides,
  };
}

export function createMockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
}

// Cleanup utilities
export function cleanupMocks(...mocks: jest.Mock[]) {
  mocks.forEach(mock => mock.mockClear());
}

export function cleanupAllMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}