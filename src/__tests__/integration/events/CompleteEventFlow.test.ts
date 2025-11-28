import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageBus } from '../../../../shared/services/MessageBus';
import { DomainEvents } from '../../../../shared/events/DomainEvents';
import { InventoryEventHandlers } from '../../../../inventory/eventHandlers/InventoryEventHandlers';
import { SalesEventHandlers } from '../../../../sales/eventHandlers/SalesEventHandlers';
import { setupTestEnvironment, teardownTestEnvironment } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';

describe('Complete Event Flow Integration Tests', () => {
  let messageBus: MessageBus;
  let inventoryHandlers: InventoryEventHandlers;
  let salesHandlers: SalesEventHandlers;
  let mockRabbitMQ: any;
  let testData: any;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    messageBus = MessageBus.getInstance();
    inventoryHandlers = new InventoryEventHandlers({
      messageBus,
      metrics: testServices.get('metrics'),
      logger: testServices.get('logger')
    });
    salesHandlers = new SalesEventHandlers({
      messageBus,
      metrics: testServices.get('metrics'),
      logger: testServices.get('logger')
    });
    mockRabbitMQ = testServices.get('rabbitmq');

    testData = {
      product: {
        productId: 'product-123',
        name: 'Test Product',
        sku: 'TEST-001',
        categoryId: 'cat-123',
        price: 100.00
      },
      customer: {
        customerId: 'customer-456',
        name: 'John Doe',
        email: 'john@example.com'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Processing Flow', () => {
    it('should complete full order processing flow', async () => {
      const orderId = 'order-789';
      const items = [
        {
          productId: testData.product.productId,
          quantity: 3,
          price: testData.product.price
        }
      ];

      // Step 1: Place Order
      const orderPlacedEvent = DomainEvents.orderPlaced({
        orderId,
        customerId: testData.customer.customerId,
        items,
        totalAmount: 300.00,
        paymentMethod: 'credit_card'
      });

      await messageBus.publishEvent(orderPlacedEvent);

      // Step 2: Process Payment
      const paymentProcessedEvent = DomainEvents.paymentProcessed({
        orderId,
        paymentId: 'payment-123',
        amount: 300.00,
        paymentMethod: 'credit_card',
        status: 'completed',
        transactionId: 'txn-456'
      });

      await messageBus.publishEvent(paymentProcessedEvent);

      // Step 3: Update Inventory (should trigger via order completion)
      const inventoryUpdatedEvent = DomainEvents.inventoryUpdated({
        productId: testData.product.productId,
        newQuantity: 47, // 50 - 3
        previousQuantity: 50,
        changeType: 'decrease',
        orderId
      });

      await messageBus.publishEvent(inventoryUpdatedEvent);

      // Verify all events were published
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(3);

      // Verify event types
      expect(publishCalls[0][0]).toBe('OrderPlaced');
      expect(publishCalls[1][0]).toBe('PaymentProcessed');
      expect(publishCalls[2][0]).toBe('InventoryUpdated');

      // Verify events contain correct data
      expect(JSON.parse(publishCalls[0][1])).toMatchObject({
        id: expect.any(String),
        type: 'OrderPlaced',
        aggregateId: orderId,
        data: {
          orderId,
          customerId: testData.customer.customerId,
          items,
          totalAmount: 300.00
        }
      });
    });

    it('should handle stock reservation and release flow', async () => {
      const orderId = 'order-reserve-123';

      // Step 1: Reserve stock for order
      const stockReservedEvent = DomainEvents.stockReserved({
        orderId,
        reservations: [
          {
            productId: testData.product.productId,
            quantity: 5,
            reservationId: 'reserve-123'
          }
        ]
      });

      await messageBus.publishEvent(stockReservedEvent);

      // Step 2: Complete the order (stock will be deducted)
      const inventoryUpdatedEvent = DomainEvents.inventoryUpdated({
        productId: testData.product.productId,
        newQuantity: 45, // 50 - 5
        previousQuantity: 50,
        changeType: 'decrease',
        reservationId: 'reserve-123',
        orderId
      });

      await messageBus.publishEvent(inventoryUpdatedEvent);

      // Step 3: If order fails, release stock
      const stockReleasedEvent = DomainEvents.stockReleased({
        orderId,
        releases: [
          {
            productId: testData.product.productId,
            quantity: 5,
            reservationId: 'reserve-123'
          }
        ]
      });

      await messageBus.publishEvent(stockReleasedEvent);

      // Verify events
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(3);
      
      expect(publishCalls[0][0]).toBe('StockReserved');
      expect(publishCalls[1][0]).toBe('InventoryUpdated');
      expect(publishCalls[2][0]).toBe('StockReleased');
    });
  });

  describe('Inventory Management Flow', () => {
    it('should handle restocking and alert flow', async () => {
      const productId = testData.product.productId;

      // Step 1: Initial low stock
      const lowStockEvent1 = DomainEvents.lowStockAlert({
        productId,
        currentStock: 5,
        minimumStock: 10,
        alertType: 'low_stock'
      });

      await messageBus.publishEvent(lowStockEvent1);

      // Step 2: Restock the product
      const restockEvent = DomainEvents.productRestocked({
        productId,
        previousQuantity: 5,
        newQuantity: 50,
        restockQuantity: 45,
        supplierId: 'supplier-123',
        restockCost: 450.00
      });

      await messageBus.publishEvent(restockEvent);

      // Step 3: Update inventory with new stock
      const inventoryUpdatedEvent = DomainEvents.inventoryUpdated({
        productId,
        newQuantity: 50,
        previousQuantity: 5,
        changeType: 'restock'
      });

      await messageBus.publishEvent(inventoryUpdatedEvent);

      // Verify events
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(3);

      expect(publishCalls[0][0]).toBe('LowStockAlert');
      expect(publishCalls[1][0]).toBe('ProductRestocked');
      expect(publishCalls[2][0]).toBe('InventoryUpdated');

      // Verify metrics were recorded
      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'inventory_alerts_total',
        expect.objectContaining({
          productId,
          alertType: 'low_stock'
        })
      );
    });

    it('should handle product lifecycle events', async () => {
      const productId = testData.product.productId;

      // Step 1: Create product
      const productCreatedEvent = DomainEvents.productCreated({
        productId,
        name: testData.product.name,
        sku: testData.product.sku,
        categoryId: testData.product.categoryId,
        price: testData.product.price
      });

      await messageBus.publishEvent(productCreatedEvent);

      // Step 2: Update product details
      const productUpdatedEvent = DomainEvents.productUpdated({
        productId,
        changes: {
          name: 'Updated Product Name',
          price: 120.00
        }
      });

      await messageBus.publishEvent(productUpdatedEvent);

      // Step 3: Deactivate product
      const productDeactivatedEvent = DomainEvents.productDeactivated({
        productId,
        reason: 'discontinued'
      });

      await messageBus.publishEvent(productDeactivatedEvent);

      // Verify events
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(3);

      expect(publishCalls[0][0]).toBe('ProductCreated');
      expect(publishCalls[1][0]).toBe('ProductUpdated');
      expect(publishCalls[2][0]).toBe('ProductDeactivated');
    });
  });

  describe('Cross-Bounded-Context Communication', () => {
    it('should handle inventory notifications to sales', async () => {
      const productId = testData.product.productId;
      const inventoryNotificationEvent = DomainEvents.inventoryNotification({
        productId,
        notificationType: 'out_of_stock',
        currentStock: 0,
        affectedOrders: ['order-1', 'order-2']
      });

      await messageBus.publishEvent(inventoryNotificationEvent);

      // This should trigger sales system to handle out-of-stock notifications
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(1);
      expect(publishCalls[0][0]).toBe('InventoryNotification');
    });

    it('should handle customer notifications from sales to inventory', async () => {
      const customerId = testData.customer.customerId;
      const customerCreatedEvent = DomainEvents.customerCreated({
        customerId,
        name: testData.customer.name,
        email: testData.customer.email,
        tier: 'premium'
      });

      await messageBus.publishEvent(customerCreatedEvent);

      // This might trigger inventory to update customer preferences
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(1);
      expect(publishCalls[0][0]).toBe('CustomerCreated');
    });
  });

  describe('Event-Driven Error Recovery', () => {
    it('should handle failed payment and release stock', async () => {
      const orderId = 'order-fail-123';
      const items = [
        {
          productId: testData.product.productId,
          quantity: 2,
          price: testData.product.price
        }
      ];

      // Step 1: Place order
      const orderPlacedEvent = DomainEvents.orderPlaced({
        orderId,
        customerId: testData.customer.customerId,
        items,
        totalAmount: 200.00,
        paymentMethod: 'credit_card'
      });

      await messageBus.publishEvent(orderPlacedEvent);

      // Step 2: Payment fails
      const paymentFailedEvent = DomainEvents.paymentProcessed({
        orderId,
        paymentId: 'payment-fail',
        amount: 200.00,
        paymentMethod: 'credit_card',
        status: 'failed',
        transactionId: 'txn-fail',
        failureReason: 'insufficient_funds'
      });

      await messageBus.publishEvent(paymentFailedEvent);

      // Step 3: Release reserved stock
      const stockReleasedEvent = DomainEvents.stockReleased({
        orderId,
        releases: [
          {
            productId: testData.product.productId,
            quantity: 2,
            reason: 'payment_failed'
          }
        ]
      });

      await messageBus.publishEvent(stockReleasedEvent);

      // Verify events
      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(3);

      expect(publishCalls[0][0]).toBe('OrderPlaced');
      expect(publishCalls[1][0]).toBe('PaymentProcessed');
      expect(publishCalls[2][0]).toBe('StockReleased');

      // Verify payment failure status
      const paymentEvent = JSON.parse(publishCalls[1][1]);
      expect(paymentEvent.data.status).toBe('failed');
      expect(paymentEvent.data.failureReason).toBe('insufficient_funds');
    });
  });

  describe('Event Performance Under Load', () => {
    it('should handle high-volume order processing', async () => {
      const startTime = Date.now();
      const orders = Array.from({ length: 100 }, (_, i) => ({
        orderId: `order-${i}`,
        customerId: `customer-${Math.floor(i / 10)}`,
        items: [
          {
            productId: `product-${i % 10}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: 100.00
          }
        ],
        totalAmount: Math.floor(Math.random() * 500) + 100,
        paymentMethod: 'credit_card'
      }));

      // Publish all order events
      for (const order of orders) {
        const orderPlacedEvent = DomainEvents.orderPlaced(order);
        await messageBus.publishEvent(orderPlacedEvent);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should handle 100 orders in reasonable time
      expect(processingTime).toBeLessThan(5000); // 5 seconds

      const publishCalls = mockRabbitMQ.publish.mock.calls;
      expect(publishCalls).toHaveLength(100);
    });
  });
});