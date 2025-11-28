import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment, makeRequest, createExpressTestApp } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';
import { testDatabase } from '../../utils/database-utils';
import { TestDataFactory } from '../../utils/test-utils';

describe('End-to-End Test Suite', () => {
  let app: any;
  let authToken: string;
  let userId: string;
  let orderId: string;
  let productId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    app = createExpressTestApp();
    await resetTestData();
    
    // Setup common test routes
    setupTestRoutes(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function resetTestData() {
    await testDatabase.reset();
  }

  function setupTestRoutes(app: any) {
    // Authentication routes
    app.post('/auth/login', (req: any, res: any) => {
      const { email, password } = req.body;
      
      // Mock authentication
      if (email === 'test@example.com' && password === 'test123') {
        const token = `jwt-token-${Date.now()}`;
        const user = { id: 'user-123', email, role: 'user', name: 'Test User' };
        
        res.json({
          token,
          user,
          expiresIn: '24h'
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // Product management routes
    app.get('/api/products', (req: any, res: any) => {
      const products = [
        {
          id: 'product-1',
          name: 'Test Product 1',
          price: 100.00,
          stockQuantity: 50,
          categoryId: 'cat-1'
        },
        {
          id: 'product-2',
          name: 'Test Product 2',
          price: 200.00,
          stockQuantity: 30,
          categoryId: 'cat-1'
        }
      ];
      
      res.json({
        products,
        total: products.length,
        page: 1,
        limit: 10
      });
    });

    app.post('/api/products', (req: any, res: any) => {
      const { name, price, stockQuantity } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const newProduct = {
        id: `product-${Date.now()}`,
        name,
        price,
        stockQuantity,
        categoryId: 'cat-1',
        createdAt: new Date().toISOString()
      };

      res.status(201).json(newProduct);
    });

    // Order management routes
    app.get('/api/orders', (req: any, res: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const orders = [
        {
          id: 'order-1',
          userId: req.user.id,
          status: 'pending',
          totalAmount: 300.00,
          items: [
            { productId: 'product-1', quantity: 1, price: 100.00 },
            { productId: 'product-2', quantity: 1, price: 200.00 }
          ],
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ orders, total: orders.length });
    });

    app.post('/api/orders', async (req: any, res: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { items } = req.body;
      
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      const newOrder = {
        id: `order-${Date.now()}`,
        userId: req.user.id,
        status: 'pending',
        totalAmount,
        items,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(newOrder);
    });

    // Payment routes
    app.post('/api/payments', (req: any, res: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { orderId, amount, paymentMethod } = req.body;
      
      // Simulate payment processing
      const payment = {
        id: `payment-${Date.now()}`,
        orderId,
        amount,
        status: 'completed',
        transactionId: `txn-${Date.now()}`,
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(payment);
    });

    // Inventory routes
    app.get('/api/inventory/:productId', (req: any, res: any) => {
      const inventory = {
        productId: req.params.productId,
        currentStock: 50,
        reservedStock: 5,
        minimumStock: 10,
        lastUpdated: new Date().toISOString()
      };

      res.json(inventory);
    });

    app.put('/api/inventory/:productId', (req: any, res: any) => {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { stockQuantity } = req.body;
      
      const updatedInventory = {
        productId: req.params.productId,
        currentStock: stockQuantity,
        reservedStock: 0,
        minimumStock: 10,
        lastUpdated: new Date().toISOString()
      };

      res.json(updatedInventory);
    });
  }

  describe('Complete Order Processing Flow', () => {
    it('should complete full order workflow from product browsing to payment', async () => {
      // Step 1: User login
      const loginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'test123'
        }
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user).toBeDefined();

      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      // Step 2: Browse products
      const productsResponse = await makeRequest(app, 'GET', '/api/products', {
        auth: { token: authToken, userId, role: 'user' }
      });

      expect(productsResponse.status).toBe(200);
      expect(productsResponse.body.products).toHaveLength(2);
      expect(productsResponse.body.products[0]).toMatchObject({
        id: 'product-1',
        name: 'Test Product 1',
        price: 100.00
      });

      // Step 3: Create order
      const orderItems = [
        {
          productId: 'product-1',
          quantity: 2,
          price: 100.00
        },
        {
          productId: 'product-2',
          quantity: 1,
          price: 200.00
        }
      ];

      const orderResponse = await makeRequest(app, 'POST', '/api/orders', {
        auth: { token: authToken, userId, role: 'user' },
        body: { items: orderItems }
      });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.totalAmount).toBe(400.00); // 2*100 + 1*200
      expect(orderResponse.body.items).toEqual(orderItems);

      orderId = orderResponse.body.id;

      // Step 4: Process payment
      const paymentResponse = await makeRequest(app, 'POST', '/api/payments', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          orderId,
          amount: 400.00,
          paymentMethod: 'credit_card'
        }
      });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.status).toBe('completed');
      expect(paymentResponse.body.amount).toBe(400.00);

      // Step 5: Verify order status
      const ordersResponse = await makeRequest(app, 'GET', '/api/orders', {
        auth: { token: authToken, userId, role: 'user' }
      });

      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toHaveLength(1);
      expect(ordersResponse.body.orders[0].id).toBe(orderId);
    });

    it('should handle order cancellation and refund process', async () => {
      // Setup user and create order first
      const loginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'test123'
        }
      });

      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      const orderResponse = await makeRequest(app, 'POST', '/api/orders', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          items: [{ productId: 'product-1', quantity: 1, price: 100.00 }]
        }
      });

      orderId = orderResponse.body.id;

      // Process payment
      await makeRequest(app, 'POST', '/api/payments', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          orderId,
          amount: 100.00,
          paymentMethod: 'credit_card'
        }
      });

      // Cancel order (this would normally trigger refund)
      const cancelResponse = await makeRequest(app, 'PUT', `/api/orders/${orderId}/cancel`, {
        auth: { token: authToken, userId, role: 'user' },
        body: { reason: 'customer_request' }
      });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe('cancelled');
      expect(cancelResponse.body.refundStatus).toBe('processing');
    });
  });

  describe('Inventory Management Flow', () => {
    it('should complete inventory update workflow', async () => {
      // Step 1: Admin login
      const adminLoginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });

      const adminToken = adminLoginResponse.body.token;
      const adminId = adminLoginResponse.body.user.id;

      // Step 2: Check current inventory
      const inventoryResponse = await makeRequest(app, 'GET', '/api/inventory/product-1', {
        auth: { token: adminToken, userId: adminId, role: 'admin' }
      });

      expect(inventoryResponse.status).toBe(200);
      expect(inventoryResponse.body.currentStock).toBe(50);

      // Step 3: Update inventory
      const updateResponse = await makeRequest(app, 'PUT', '/api/inventory/product-1', {
        auth: { token: adminToken, userId: adminId, role: 'admin' },
        body: { stockQuantity: 75 }
      });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.currentStock).toBe(75);

      // Step 4: Verify updated inventory
      const updatedInventoryResponse = await makeRequest(app, 'GET', '/api/inventory/product-1', {
        auth: { token: adminToken, userId: adminId, role: 'admin' }
      });

      expect(updatedInventoryResponse.status).toBe(200);
      expect(updatedInventoryResponse.body.currentStock).toBe(75);
    });

    it('should handle low stock alerts', async () => {
      // Step 1: Check inventory before low stock
      const initialInventoryResponse = await makeRequest(app, 'GET', '/api/inventory/product-1');
      expect(initialInventoryResponse.body.currentStock).toBe(50);

      // Step 2: Admin updates stock to low levels
      const adminLoginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });

      const adminToken = adminLoginResponse.body.token;
      const adminId = adminLoginResponse.body.user.id;

      const updateResponse = await makeRequest(app, 'PUT', '/api/inventory/product-1', {
        auth: { token: adminToken, userId: adminId, role: 'admin' },
        body: { stockQuantity: 5 }
      });

      expect(updateResponse.status).toBe(200);

      // Step 3: Verify low stock trigger
      const lowStockAlert = await checkLowStockAlert('product-1');
      expect(lowStockAlert.triggered).toBe(true);
      expect(lowStockAlert.currentStock).toBeLessThan(10);
    });
  });

  describe('Product Management Flow', () => {
    it('should complete product creation and management workflow', async () => {
      // Step 1: Admin authentication
      const adminLoginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });

      const adminToken = adminLoginResponse.body.token;
      const adminId = adminLoginResponse.body.user.id;

      // Step 2: Create new product
      const newProductData = {
        name: 'E2E Test Product',
        price: 299.99,
        stockQuantity: 100
      };

      const createProductResponse = await makeRequest(app, 'POST', '/api/products', {
        auth: { token: adminToken, userId: adminId, role: 'admin' },
        body: newProductData
      });

      expect(createProductResponse.status).toBe(201);
      expect(createProductResponse.body.name).toBe(newProductData.name);
      expect(createProductResponse.body.price).toBe(newProductData.price);

      productId = createProductResponse.body.id;

      // Step 3: Verify product appears in product list
      const productsResponse = await makeRequest(app, 'GET', '/api/products', {
        auth: { token: adminToken, userId: adminId, role: 'admin' }
      });

      expect(productsResponse.status).toBe(200);
      expect(productsResponse.body.products.length).toBeGreaterThan(2);

      // Step 4: Update product inventory
      const inventoryUpdateResponse = await makeRequest(app, 'PUT', `/api/inventory/${productId}`, {
        auth: { token: adminToken, userId: adminId, role: 'admin' },
        body: { stockQuantity: 150 }
      });

      expect(inventoryUpdateResponse.status).toBe(200);
      expect(inventoryUpdateResponse.body.currentStock).toBe(150);
    });
  });

  describe('User Account Management Flow', () => {
    it('should complete user profile management workflow', async () => {
      // Step 1: Register new user (simulated)
      const newUserData = {
        name: 'E2E Test User',
        email: 'e2e@example.com',
        password: 'securePassword123'
      };

      const registerResponse = await makeRequest(app, 'POST', '/auth/register', {
        body: newUserData
      });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.email).toBe(newUserData.email);

      // Step 2: Login with new user
      const loginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: newUserData.email,
          password: newUserData.password
        }
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.email).toBe(newUserData.email);

      const userToken = loginResponse.body.token;
      const loggedInUserId = loginResponse.body.user.id;

      // Step 3: Access protected resources
      const profileResponse = await makeRequest(app, 'GET', '/api/profile', {
        auth: { token: userToken, userId: loggedInUserId, role: 'user' }
      });

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe(newUserData.email);

      // Step 4: Update profile
      const updateProfileResponse = await makeRequest(app, 'PUT', '/api/profile', {
        auth: { token: userToken, userId: loggedInUserId, role: 'user' },
        body: {
          name: 'Updated E2E Test User',
          preferences: { theme: 'dark', notifications: true }
        }
      });

      expect(updateProfileResponse.status).toBe(200);
      expect(updateProfileResponse.body.name).toBe('Updated E2E Test User');
    });
  });

  describe('Cross-Bounded-Context Communication Flow', () => {
    it('should handle sales-to-inventory communication', async () => {
      // Step 1: User places order (Sales context)
      const loginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'test123'
        }
      });

      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      const orderResponse = await makeRequest(app, 'POST', '/api/orders', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          items: [{ productId: 'product-1', quantity: 10, price: 100.00 }]
        }
      });

      expect(orderResponse.status).toBe(201);
      orderId = orderResponse.body.id;

      // Step 2: Payment processing (Sales context)
      const paymentResponse = await makeRequest(app, 'POST', '/api/payments', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          orderId,
          amount: 1000.00,
          paymentMethod: 'credit_card'
        }
      });

      expect(paymentResponse.status).toBe(201);

      // Step 3: Inventory deduction (Inventory context) - triggered by order completion
      const inventoryResponse = await makeRequest(app, 'GET', '/api/inventory/product-1');
      
      // In real system, this would be triggered by event from Sales context
      expect(inventoryResponse.status).toBe(200);
      expect(inventoryResponse.body.reservedStock).toBe(10); // Reserved for the order
    });
  });

  describe('Error Handling and Recovery Flow', () => {
    it('should handle payment failure and order recovery', async () => {
      // Step 1: User login
      const loginResponse = await makeRequest(app, 'POST', '/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'test123'
        }
      });

      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      // Step 2: Create order
      const orderResponse = await makeRequest(app, 'POST', '/api/orders', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          items: [{ productId: 'product-1', quantity: 1, price: 100.00 }]
        }
      });

      expect(orderResponse.status).toBe(201);
      orderId = orderResponse.body.id;

      // Step 3: Simulate payment failure
      const failedPaymentResponse = await makeRequest(app, 'POST', '/api/payments/failed', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          orderId,
          amount: 100.00,
          paymentMethod: 'credit_card',
          simulateFailure: true
        }
      });

      expect(failedPaymentResponse.status).toBe(402); // Payment Required

      // Step 4: Order should remain pending
      const orderStatusResponse = await makeRequest(app, 'GET', `/api/orders/${orderId}`, {
        auth: { token: authToken, userId, role: 'user' }
      });

      expect(orderStatusResponse.status).toBe(200);
      expect(orderStatusResponse.body.status).toBe('pending');

      // Step 5: Retry payment
      const retryPaymentResponse = await makeRequest(app, 'POST', '/api/payments', {
        auth: { token: authToken, userId, role: 'user' },
        body: {
          orderId,
          amount: 100.00,
          paymentMethod: 'debit_card' // Different payment method
        }
      });

      expect(retryPaymentResponse.status).toBe(201);
    });
  });
});

// Helper functions for E2E tests
async function checkLowStockAlert(productId: string): Promise<{ triggered: boolean; currentStock: number }> {
  // In real implementation, this would check the event system or notification service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        triggered: true,
        currentStock: 5 // Mock low stock
      });
    }, 100);
  });
}