import { PrismaClient } from '@prisma/client';
import { TestDataFactory } from './test-utils';

// Mock Prisma for testing
export class MockPrismaClient {
  constructor() {
    this.initializeMocks();
  }

  private initializeMocks() {
    // Mock all Prisma methods that are commonly used
    this.user = this.createMockEntity('user');
    this.product = this.createMockEntity('product');
    this.order = this.createMockEntity('order');
    this.inventory = this.createMockEntity('inventory');
    this.category = this.createMockEntity('category');
    this.orderItem = this.createMockEntity('orderItem');
    this.supplier = this.createMockEntity('supplier');
    this.auditLog = this.createMockEntity('auditLog');
    this.$transaction = jest.fn();
    this.$connect = jest.fn().mockResolvedValue(undefined);
    this.$disconnect = jest.fn().mockResolvedValue(undefined);
    this.$on = jest.fn();
    this.$use = jest.fn();
  }

  private createMockEntity(entityName: string) {
    return {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
    };
  }

  // Expose mocked entities
  public user: any;
  public product: any;
  public order: any;
  public inventory: any;
  public category: any;
  public orderItem: any;
  public supplier: any;
  public auditLog: any;
  public $transaction: jest.Mock;
  public $connect: jest.Mock;
  public $disconnect: jest.Mock;
  public $on: jest.Mock;
  public $use: jest.Mock;
}

// Test Database Manager
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private prisma: MockPrismaClient;
  private isInitialized = false;

  constructor() {
    this.prisma = new MockPrismaClient();
  }

  public static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Reset all mocks
    this.resetMocks();
    
    // Setup default test data
    this.setupDefaultTestData();
  }

  public getPrisma(): MockPrismaClient {
    return this.prisma;
  }

  private resetMocks(): void {
    // Reset all entity mocks
    Object.values(this.prisma).forEach((entity: any) => {
      if (entity && typeof entity === 'object') {
        Object.keys(entity).forEach(method => {
          if (typeof entity[method] === 'function') {
            entity[method].mockClear();
          }
        });
      }
    });
  }

  private setupDefaultTestData(): void {
    // Setup default test data for user entity
    this.prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'user-test-123') {
        return TestDataFactory.createUser();
      }
      return null;
    });

    this.prisma.user.findMany.mockResolvedValue([
      TestDataFactory.createUser(),
      TestDataFactory.createUser({ id: 'user-test-456', email: 'test2@example.com' }),
    ]);

    // Setup default test data for product entity
    this.prisma.product.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'product-test-123') {
        return TestDataFactory.createProduct();
      }
      return null;
    });

    this.prisma.product.findMany.mockResolvedValue([
      TestDataFactory.createProduct(),
      TestDataFactory.createProduct({ id: 'product-test-456', name: 'Test Product 2' }),
    ]);

    // Setup default test data for inventory entity
    this.prisma.inventory.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'inventory-test-123') {
        return TestDataFactory.createInventory();
      }
      return null;
    });

    this.prisma.inventory.findMany.mockResolvedValue([
      TestDataFactory.createInventory(),
      TestDataFactory.createInventory({ id: 'inventory-test-456', currentStock: 75 }),
    ]);

    // Setup default test data for order entity
    this.prisma.order.findUnique.mockImplementation(({ where }) => {
      if (where.id === 'order-test-123') {
        return TestDataFactory.createOrder();
      }
      return null;
    });

    this.prisma.order.findMany.mockResolvedValue([
      TestDataFactory.createOrder(),
      TestDataFactory.createOrder({ id: 'order-test-456', status: 'completed' }),
    ]);
  }

  public async cleanup(): Promise<void> {
    // Clean up test data
    this.resetMocks();
  }

  public async reset(): Promise<void> {
    await this.cleanup();
    this.setupDefaultTestData();
  }
}

// Global test database instance
export const testDatabase = TestDatabaseManager.getInstance();