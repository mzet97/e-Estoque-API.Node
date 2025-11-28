import { testDatabase } from '../utils/database-utils';
import { testServices } from '../mocks/mock-services';
import { cleanupAllMocks } from '../utils/test-utils';

export class TestRunner {
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (TestRunner.initialized) return;

    try {
      // Initialize test database
      await testDatabase.initialize();

      // Initialize all test services
      await testServices.initializeAll();

      TestRunner.initialized = true;
      console.log('Test environment initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  }

  public static async cleanup(): Promise<void> {
    if (!TestRunner.initialized) return;

    try {
      // Cleanup test services
      await testServices.cleanup();

      // Cleanup test database
      await testDatabase.cleanup();

      // Cleanup all mocks
      cleanupAllMocks();

      TestRunner.initialized = false;
      console.log('Test environment cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup test environment:', error);
      throw error;
    }
  }

  public static async reset(): Promise<void> {
    await TestRunner.cleanup();
    await TestRunner.initialize();
  }
}

// Test lifecycle hooks for Jest
export async function setupTestEnvironment(): Promise<void> {
  await TestRunner.initialize();
}

export async function teardownTestEnvironment(): Promise<void> {
  await TestRunner.cleanup();
}

export async function resetTestEnvironment(): Promise<void> {
  await TestRunner.reset();
}

// Express Test Helper
export function createExpressTestApp() {
  const express = require('express');
  const app = express();
  
  // Add common middleware for testing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add test routes
  app.get('/test/health', (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/test/echo', (req: any, res: any) => {
    res.json({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  });

  return app;
}

// HTTP Test Helper
export async function makeRequest(
  app: any,
  method: string,
  url: string,
  options: {
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
    auth?: { token: string; userId: string; role: string };
  } = {}
): Promise<any> {
  const request = require('supertest')(app);
  
  const req = request[method.toLowerCase()](url);

  // Add headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      req.set(key, value);
    });
  }

  // Add authentication
  if (options.auth) {
    req.set('Authorization', `Bearer ${options.auth.token}`);
    req.set('X-User-ID', options.auth.userId);
    req.set('X-User-Role', options.auth.role);
  }

  // Add query parameters
  if (options.query) {
    req.query(options.query);
  }

  // Add body
  if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    req.send(options.body);
  }

  return req;
}

// Database Test Helper
export function setupDatabaseSpies() {
  const prisma = testDatabase.getPrisma();

  // Common database operation spies
  return {
    user: {
      createSpy: jest.spyOn(prisma.user, 'create'),
      findUniqueSpy: jest.spyOn(prisma.user, 'findUnique'),
      findManySpy: jest.spyOn(prisma.user, 'findMany'),
      updateSpy: jest.spyOn(prisma.user, 'update'),
      deleteSpy: jest.spyOn(prisma.user, 'delete'),
      countSpy: jest.spyOn(prisma.user, 'count'),
    },
    product: {
      createSpy: jest.spyOn(prisma.product, 'create'),
      findUniqueSpy: jest.spyOn(prisma.product, 'findUnique'),
      findManySpy: jest.spyOn(prisma.product, 'findMany'),
      updateSpy: jest.spyOn(prisma.product, 'update'),
      deleteSpy: jest.spyOn(prisma.product, 'delete'),
      countSpy: jest.spyOn(prisma.product, 'count'),
    },
    order: {
      createSpy: jest.spyOn(prisma.order, 'create'),
      findUniqueSpy: jest.spyOn(prisma.order, 'findUnique'),
      findManySpy: jest.spyOn(prisma.order, 'findMany'),
      updateSpy: jest.spyOn(prisma.order, 'update'),
      deleteSpy: jest.spyOn(prisma.order, 'delete'),
      countSpy: jest.spyOn(prisma.order, 'count'),
    },
    inventory: {
      createSpy: jest.spyOn(prisma.inventory, 'create'),
      findUniqueSpy: jest.spyOn(prisma.inventory, 'findUnique'),
      findManySpy: jest.spyOn(prisma.inventory, 'findMany'),
      updateSpy: jest.spyOn(prisma.inventory, 'update'),
      deleteSpy: jest.spyOn(prisma.inventory, 'delete'),
      countSpy: jest.spyOn(prisma.inventory, 'count'),
    },
  };
}

// Event Test Helper
export function setupEventSpies() {
  const { MessageBus } = require('../../src/shared/services/MessageBus');
  const { DomainEvents } = require('../../src/shared/events/DomainEvents');

  return {
    messageBusPublishSpy: jest.spyOn(MessageBus.getInstance(), 'publish'),
    messageBusSubscribeSpy: jest.spyOn(MessageBus.getInstance(), 'subscribe'),
    domainEventsSpy: jest.spyOn(DomainEvents, 'publish'),
  };
}

// Service Test Helper
export function setupServiceSpies() {
  const redis = testServices.get('redis');
  const rabbitmq = testServices.get('rabbitmq');
  const metrics = testServices.get('metrics');
  const logger = testServices.get('logger');

  return {
    redisSpy: {
      getSpy: jest.spyOn(redis, 'get'),
      setSpy: jest.spyOn(redis, 'set'),
      delSpy: jest.spyOn(redis, 'del'),
      incrSpy: jest.spyOn(redis, 'incr'),
      decrSpy: jest.spyOn(redis, 'decr'),
    },
    rabbitmqSpy: {
      publishSpy: jest.spyOn(rabbitmq, 'publish'),
      consumeSpy: jest.spyOn(rabbitmq, 'consume'),
    },
    metricsSpy: {
      incrementSpy: jest.spyOn(metrics, 'incrementCounter'),
      recordSpy: jest.spyOn(metrics, 'recordHistogram'),
    },
    loggerSpy: {
      infoSpy: jest.spyOn(logger, 'info'),
      errorSpy: jest.spyOn(logger, 'error'),
      warnSpy: jest.spyOn(logger, 'warn'),
      debugSpy: jest.spyOn(logger, 'debug'),
    },
  };
}

// Test assertions
export const TestAssertions = {
  expectPrismaError: (fn: () => any, expectedCode?: string) => {
    expect(fn).rejects.toThrow();
    // You can add more specific error assertions here
  },

  expectRedisCall: (spy: jest.Mock, expectedKey?: string) => {
    expect(spy).toHaveBeenCalled();
    if (expectedKey) {
      expect(spy).toHaveBeenCalledWith(expectedKey);
    }
  },

  expectRabbitMQPublish: (spy: jest.Mock, expectedQueue?: string) => {
    expect(spy).toHaveBeenCalled();
    if (expectedQueue) {
      expect(spy).toHaveBeenCalledWith(
        expectedQueue,
        expect.any(Object),
        expect.any(Object)
      );
    }
  },

  expectMetricsCall: (spy: jest.Mock, expectedName?: string) => {
    expect(spy).toHaveBeenCalled();
    if (expectedName) {
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(expectedName),
        expect.any(Object)
      );
    }
  },

  expectLogCall: (spy: jest.Mock, expectedMessage?: string) => {
    expect(spy).toHaveBeenCalled();
    if (expectedMessage) {
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(expectedMessage),
        expect.any(Object),
        expect.any(String)
      );
    }
  },
};