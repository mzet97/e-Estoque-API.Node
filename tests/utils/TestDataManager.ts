import { TestDataFactory } from './test-utils';
import { testDatabase } from './database-utils';
import { jest } from '@jest/globals';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'manager';
  isActive: boolean;
  createdAt: Date;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  attributes?: Record<string, any>;
}

export interface TestOrder {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TestInventory {
  id: string;
  productId: string;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  maximumStock: number;
  lastRestockedAt: Date;
  location?: string;
  batchNumber?: string;
}

export class TestDataManager {
  private static instance: TestDataManager;
  private createdEntities: Map<string, any[]> = new Map();
  private seedData: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeSeedData();
  }

  public static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  private initializeSeedData(): void {
    // Seed users
    const users = [
      {
        id: 'seed-admin-1',
        email: 'admin@eestoque.com',
        name: 'Admin User',
        role: 'admin' as const,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        preferences: { theme: 'dark' as const, notifications: true }
      },
      {
        id: 'seed-user-1',
        email: 'user@eestoque.com',
        name: 'Regular User',
        role: 'user' as const,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        preferences: { theme: 'light' as const, notifications: true }
      },
      {
        id: 'seed-manager-1',
        email: 'manager@eestoque.com',
        name: 'Manager User',
        role: 'manager' as const,
        isActive: true,
        createdAt: new Date('2024-01-03'),
        preferences: { theme: 'dark' as const, notifications: false }
      }
    ];
    this.seedData.set('users', users);

    // Seed categories
    const categories = [
      {
        id: 'seed-cat-electronics',
        name: 'Electronics',
        description: 'Electronic devices and components',
        parentId: undefined,
        isActive: true,
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'seed-cat-books',
        name: 'Books',
        description: 'Physical and digital books',
        parentId: undefined,
        isActive: true,
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'seed-cat-computers',
        name: 'Computers',
        description: 'Computer hardware and accessories',
        parentId: 'seed-cat-electronics',
        isActive: true,
        createdAt: new Date('2024-01-02')
      }
    ];
    this.seedData.set('categories', categories);

    // Seed products
    const products = [
      {
        id: 'seed-prod-laptop-1',
        name: 'Gaming Laptop Pro',
        description: 'High-performance gaming laptop with RTX graphics',
        price: 1299.99,
        sku: 'LAPTOP-PRO-001',
        stockQuantity: 25,
        categoryId: 'seed-cat-computers',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        attributes: {
          brand: 'TechBrand',
          model: 'Gaming Pro X1',
          warranty: '2 years',
          specifications: {
            cpu: 'Intel i7-12700H',
            ram: '16GB DDR4',
            storage: '512GB SSD',
            gpu: 'NVIDIA RTX 3070'
          }
        }
      },
      {
        id: 'seed-prod-mouse-1',
        name: 'Wireless Gaming Mouse',
        description: 'High-precision wireless mouse for gaming',
        price: 89.99,
        sku: 'MOUSE-WL-001',
        stockQuantity: 150,
        categoryId: 'seed-cat-computers',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        attributes: {
          brand: 'GameGear',
          dpi: '16000',
          connectivity: '2.4GHz Wireless',
          batteryLife: '70 hours'
        }
      },
      {
        id: 'seed-prod-book-1',
        name: 'TypeScript Programming Guide',
        description: 'Complete guide to TypeScript development',
        price: 49.99,
        sku: 'BOOK-TS-001',
        stockQuantity: 75,
        categoryId: 'seed-cat-books',
        isActive: true,
        createdAt: new Date('2024-01-25'),
        attributes: {
          author: 'Jane Developer',
          pages: 450,
          format: 'Paperback',
          isbn: '978-1234567890'
        }
      }
    ];
    this.seedData.set('products', products);

    // Seed inventory
    const inventory = [
      {
        id: 'seed-inv-laptop-1',
        productId: 'seed-prod-laptop-1',
        currentStock: 25,
        reservedStock: 3,
        minimumStock: 5,
        maximumStock: 100,
        lastRestockedAt: new Date('2024-11-20'),
        location: 'Warehouse-A-01',
        batchNumber: 'BATCH-2024-001'
      },
      {
        id: 'seed-inv-mouse-1',
        productId: 'seed-prod-mouse-1',
        currentStock: 150,
        reservedStock: 12,
        minimumStock: 20,
        maximumStock: 500,
        lastRestockedAt: new Date('2024-11-25'),
        location: 'Warehouse-B-02',
        batchNumber: 'BATCH-2024-002'
      }
    ];
    this.seedData.set('inventory', inventory);
  }

  // User management methods
  public createUser(overrides: Partial<TestUser> = {}): TestUser {
    const baseUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `user${Date.now()}@example.com`,
      name: 'Test User',
      role: 'user' as const,
      isActive: true,
      createdAt: new Date(),
      preferences: { theme: 'light' as const, notifications: true }
    };

    const user = { ...baseUser, ...overrides };
    this.trackCreatedEntity('users', user);
    return user;
  }

  public createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      email: `admin${Date.now()}@example.com`,
      name: 'Test Admin',
      role: 'admin',
      preferences: { theme: 'dark', notifications: true },
      ...overrides
    });
  }

  public createManagerUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      email: `manager${Date.now()}@example.com`,
      name: 'Test Manager',
      role: 'manager',
      preferences: { theme: 'light', notifications: false },
      ...overrides
    });
  }

  public getSeedUsers(): TestUser[] {
    return this.seedData.get('users') || [];
  }

  // Product management methods
  public createProduct(overrides: Partial<TestProduct> = {}): TestProduct {
    const baseProduct = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Product',
      description: 'A test product for validation',
      price: 99.99,
      sku: `SKU-${Date.now()}`,
      stockQuantity: 50,
      categoryId: 'seed-cat-electronics',
      isActive: true,
      createdAt: new Date(),
      attributes: {}
    };

    const product = { ...baseProduct, ...overrides };
    this.trackCreatedEntity('products', product);
    return product;
  }

  public createElectronicsProduct(overrides: Partial<TestProduct> = {}): TestProduct {
    return this.createProduct({
      categoryId: 'seed-cat-electronics',
      attributes: {
        brand: 'TestBrand',
        model: 'TestModel 2024',
        warranty: '1 year'
      },
      ...overrides
    });
  }

  public createBookProduct(overrides: Partial<TestProduct> = {}): TestProduct {
    return this.createProduct({
      categoryId: 'seed-cat-books',
      attributes: {
        author: 'Test Author',
        pages: 300,
        format: 'Digital'
      },
      ...overrides
    });
  }

  public getSeedProducts(): TestProduct[] {
    return this.seedData.get('products') || [];
  }

  // Order management methods
  public createOrder(overrides: Partial<TestOrder> = {}): TestOrder {
    const baseOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'seed-user-1',
      status: 'pending' as const,
      totalAmount: 0,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const order = { ...baseOrder, ...overrides };
    this.trackCreatedEntity('orders', order);
    return order;
  }

  public createOrderWithItems(userId: string, items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>, overrides: Partial<TestOrder> = {}): TestOrder {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return this.createOrder({
      userId,
      items,
      totalAmount,
      ...overrides
    });
  }

  public createCompletedOrder(userId: string, items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>): TestOrder {
    return this.createOrderWithItems(userId, items, {
      status: 'delivered',
      updatedAt: new Date()
    });
  }

  public getSeedOrders(): TestOrder[] {
    // In a real system, this would come from a database or seed data
    return [];
  }

  // Category management methods
  public createCategory(overrides: Partial<TestCategory> = {}): TestCategory {
    const baseCategory = {
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Category',
      description: 'A test category',
      parentId: undefined,
      isActive: true,
      createdAt: new Date()
    };

    const category = { ...baseCategory, ...overrides };
    this.trackCreatedEntity('categories', category);
    return category;
  }

  public createSubcategory(parentId: string, overrides: Partial<TestCategory> = {}): TestCategory {
    return this.createCategory({
      parentId,
      name: 'Test Subcategory',
      ...overrides
    });
  }

  public getSeedCategories(): TestCategory[] {
    return this.seedData.get('categories') || [];
  }

  // Inventory management methods
  public createInventory(overrides: Partial<TestInventory> = {}): TestInventory {
    const baseInventory = {
      id: `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: 'seed-prod-laptop-1',
      currentStock: 50,
      reservedStock: 5,
      minimumStock: 10,
      maximumStock: 200,
      lastRestockedAt: new Date(),
      location: 'Warehouse-A-01'
    };

    const inventory = { ...baseInventory, ...overrides };
    this.trackCreatedEntity('inventory', inventory);
    return inventory;
  }

  public createLowStockInventory(productId: string): TestInventory {
    return this.createInventory({
      productId,
      currentStock: 3,
      reservedStock: 0,
      minimumStock: 10
    });
  }

  public createOutOfStockInventory(productId: string): TestInventory {
    return this.createInventory({
      productId,
      currentStock: 0,
      reservedStock: 0,
      minimumStock: 5
    });
  }

  public getSeedInventory(): TestInventory[] {
    return this.seedData.get('inventory') || [];
  }

  // Complex scenario methods
  public createECommerceScenario(): {
    users: TestUser[];
    categories: TestCategory[];
    products: TestProduct[];
    orders: TestOrder[];
    inventory: TestInventory[];
  } {
    const admin = this.createAdminUser();
    const manager = this.createManagerUser();
    const users = [
      this.createUser({ email: 'customer1@test.com', name: 'Customer One' }),
      this.createUser({ email: 'customer2@test.com', name: 'Customer Two' }),
      this.createUser({ email: 'customer3@test.com', name: 'Customer Three' })
    ];

    const categories = [
      this.createCategory({ name: 'Sports', description: 'Sports equipment' }),
      this.createCategory({ name: 'Clothing', description: 'Apparel and fashion' }),
      this.createSubcategory('seed-cat-electronics', { name: 'Smartphones', description: 'Mobile devices' })
    ];

    const products = [
      this.createProduct({
        name: 'Running Shoes',
        price: 129.99,
        categoryId: categories[0].id,
        stockQuantity: 30,
        attributes: { brand: 'RunFast', size: '9.5', color: 'Blue' }
      }),
      this.createProduct({
        name: 'Wireless Headphones',
        price: 199.99,
        categoryId: categories[2].id,
        stockQuantity: 50,
        attributes: { brand: 'AudioMax', type: 'Over-ear', connectivity: 'Bluetooth' }
      }),
      this.createProduct({
        name: 'Cotton T-Shirt',
        price: 29.99,
        categoryId: categories[1].id,
        stockQuantity: 100,
        attributes: { material: '100% Cotton', size: 'M', color: 'White' }
      })
    ];

    const orders = [
      this.createOrderWithItems(users[0].id, [
        { productId: products[0].id, quantity: 1, price: 129.99 },
        { productId: products[2].id, quantity: 2, price: 29.99 }
      ], { status: 'delivered' }),

      this.createOrderWithItems(users[1].id, [
        { productId: products[1].id, quantity: 1, price: 199.99 }
      ], { status: 'processing' }),

      this.createOrderWithItems(users[2].id, [
        { productId: products[0].id, quantity: 2, price: 129.99 },
        { productId: products[1].id, quantity: 1, price: 199.99 },
        { productId: products[2].id, quantity: 3, price: 29.99 }
      ], { status: 'pending' })
    ];

    const inventory = products.map(product => this.createInventory({
      productId: product.id,
      currentStock: product.stockQuantity,
      reservedStock: orders.reduce((reserved, order) => {
        const orderItems = order.items.filter(item => item.productId === product.id);
        return reserved + orderItems.reduce((sum, item) => sum + item.quantity, 0);
      }, 0)
    }));

    return {
      users: [admin, manager, ...users],
      categories,
      products,
      orders,
      inventory
    };
  }

  public createLoadTestData(count: number): {
    users: TestUser[];
    products: TestProduct[];
    orders: TestOrder[];
  } {
    const users = Array.from({ length: count }, () => this.createUser());
    const products = Array.from({ length: count * 2 }, () => this.createProduct());
    
    const orders = Array.from({ length: count * 3 }, () => {
      const user = users[Math.floor(Math.random() * users.length)];
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const items = Array.from({ length: itemCount }, () => {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        return {
          productId: product.id,
          quantity,
          price: product.price
        };
      });
      
      return this.createOrderWithItems(user.id, items);
    });

    return { users, products, orders };
  }

  // Data tracking and cleanup
  private trackCreatedEntity(type: string, entity: any): void {
    if (!this.createdEntities.has(type)) {
      this.createdEntities.set(type, []);
    }
    this.createdEntities.get(type)!.push(entity);
  }

  public getCreatedEntities(type?: string): any[] {
    if (type) {
      return this.createdEntities.get(type) || [];
    }
    
    const allEntities: any[] = [];
    this.createdEntities.forEach(entities => {
      allEntities.push(...entities);
    });
    return allEntities;
  }

  public async cleanupCreatedEntities(): Promise<void> {
    // In a real implementation, this would clean up from the database
    this.createdEntities.clear();
    console.log('Test data cleanup completed');
  }

  public async resetDatabase(): Promise<void> {
    await testDatabase.reset();
    this.createdEntities.clear();
    console.log('Test database reset completed');
  }

  // Data validation
  public validateUser(user: TestUser): boolean {
    return !!(user.id && user.email && user.name && user.role);
  }

  public validateProduct(product: TestProduct): boolean {
    return !!(product.id && product.name && product.price >= 0 && product.sku);
  }

  public validateOrder(order: TestOrder): boolean {
    return !!(order.id && order.userId && order.items.length > 0 && order.totalAmount >= 0);
  }

  public validateInventory(inventory: TestInventory): boolean {
    return !!(inventory.id && inventory.productId && inventory.currentStock >= 0);
  }

  // Data export for debugging
  public exportTestData(): string {
    const data = {
      seedData: Object.fromEntries(this.seedData),
      createdEntities: Object.fromEntries(this.createdEntities),
      statistics: {
        totalSeedEntities: Array.from(this.seedData.values()).reduce((sum, entities) => sum + entities.length, 0),
        totalCreatedEntities: Array.from(this.createdEntities.values()).reduce((sum, entities) => sum + entities.length, 0)
      },
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();

// Jest matchers for test data validation
export const testDataMatchers = {
  toBeValidUser: (received: TestUser) => {
    const isValid = testDataManager.validateUser(received);
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid user`,
      pass: isValid
    };
  },
  
  toBeValidProduct: (received: TestProduct) => {
    const isValid = testDataManager.validateProduct(received);
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid product`,
      pass: isValid
    };
  },
  
  toBeValidOrder: (received: TestOrder) => {
    const isValid = testDataManager.validateOrder(received);
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid order`,
      pass: isValid
    };
  },
  
  toBeValidInventory: (received: TestInventory) => {
    const isValid = testDataManager.validateInventory(received);
    return {
      message: () => `expected ${JSON.stringify(received)} to be valid inventory`,
      pass: isValid
    };
  }
};

// Extend Jest expect if needed
if (typeof expect !== 'undefined') {
  Object.assign(expect, testDataMatchers);
}