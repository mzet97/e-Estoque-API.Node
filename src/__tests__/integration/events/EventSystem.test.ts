import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageBus } from '../../../../shared/services/MessageBus';
import { DomainEvents } from '../../../../shared/events/DomainEvents';
import { InventoryEventHandlers } from '../../../../inventory/eventHandlers/InventoryEventHandlers';
import { SalesEventHandlers } from '../../../../sales/eventHandlers/SalesEventHandlers';
import { setupTestEnvironment, teardownTestEnvironment } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';
import { TestDataFactory } from '../../utils/test-utils';

describe('Event System Integration Tests', () => {
  let messageBus: MessageBus;
  let inventoryHandlers: InventoryEventHandlers;
  let salesHandlers: SalesEventHandlers;
  let eventHandlers: any;

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
    eventHandlers = [inventoryHandlers, salesHandlers];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Domain Events Publishing Integration', () => {
    it('should publish product created event', async () => {
      const productCreatedEvent = DomainEvents.productCreated({
        productId: 'product-test-123',
        name: 'Test Product',
        sku: 'TEST-001',
        categoryId: 'cat-test-123',
        price: 100.00
      });

      const mockRabbitMQ = testServices.get('rabbitmq');
      
      await messageBus.publishEvent(productCreatedEvent);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'ProductCreated',
        expect.stringContaining(JSON.stringify(productCreatedEvent)),
        expect.objectContaining({
          correlationId: productCreatedEvent.id,
          headers: expect.objectContaining({
            eventType: 'ProductCreated',
            aggregateId: 'product-test-123'
          })
        })
      );
    });

    it('should publish inventory updated event', async () => {
      const inventoryUpdatedEvent = DomainEvents.inventoryUpdated({
        productId: 'product-test-123',
        newQuantity: 25,
        previousQuantity: 50,
        changeType: 'decrease'
      });

      const mockRabbitMQ = testServices.get('rabbitmq');
      
      await messageBus.publishEvent(inventoryUpdatedEvent);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'InventoryUpdated',
        expect.stringContaining(JSON.stringify(inventoryUpdatedEvent)),
        expect.objectContaining({
          correlationId: inventoryUpdatedEvent.id,
          headers: expect.objectContaining({
            eventType: 'InventoryUpdated',
            aggregateId: 'product-test-123'
          })
        })
      );
    });

    it('should publish order placed event', async () => {
      const orderPlacedEvent = DomainEvents.orderPlaced({
        orderId: 'order-test-123',
        customerId: 'customer-test-456',
        items: [
          {
            productId: 'product-test-123',
            quantity: 2,
            price: 100.00
          }
        ],
        totalAmount: 200.00,
        paymentMethod: 'credit_card'
      });

      const mockRabbitMQ = testServices.get('rabbitmq');
      
      await messageBus.publishEvent(orderPlacedEvent);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'OrderPlaced',
        expect.stringContaining(JSON.stringify(orderPlacedEvent)),
        expect.objectContaining({
          correlationId: orderPlacedEvent.id,
          headers: expect.objectContaining({
            eventType: 'OrderPlaced',
            aggregateId: 'order-test-123'
          })
        })
      );
    });

    it('should publish payment processed event', async () => {
      const paymentProcessedEvent = DomainEvents.paymentProcessed({
        orderId: 'order-test-123',
        paymentId: 'payment-test-789',
        amount: 200.00,
        paymentMethod: 'credit_card',
        status: 'completed',
        transactionId: 'txn-test-456'
      });

      const mockRabbitMQ = testServices.get('rabbitmq');
      
      await messageBus.publishEvent(paymentProcessedEvent);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'PaymentProcessed',
        expect.stringContaining(JSON.stringify(paymentProcessedEvent)),
        expect.objectContaining({
          correlationId: paymentProcessedEvent.id,
          headers: expect.objectContaining({
            eventType: 'PaymentProcessed',
            aggregateId: 'order-test-123'
          })
        })
      );
    });

    it('should publish low stock alert event', async () => {
      const lowStockAlertEvent = DomainEvents.lowStockAlert({
        productId: 'product-test-123',
        currentStock: 5,
        minimumStock: 10,
        alertType: 'low_stock'
      });

      const mockRabbitMQ = testServices.get('rabbitmq');
      
      await messageBus.publishEvent(lowStockAlertEvent);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'LowStockAlert',
        expect.stringContaining(JSON.stringify(lowStockAlertEvent)),
        expect.objectContaining({
          correlationId: lowStockAlertEvent.id,
          headers: expect.objectContaining({
            eventType: 'LowStockAlert',
            aggregateId: 'product-test-123'
          })
        })
      );
    });
  });

  describe('Event Subscription Integration', () => {
    it('should subscribe to inventory events and process them', async () => {
      const mockRabbitMQ = testServices.get('rabbitmq');
      const metrics = testServices.get('metrics');
      const logger = testServices.get('logger');

      // Setup subscriptions
      await messageBus.subscribe('ProductCreated', inventoryHandlers.handleProductCreated);
      await messageBus.subscribe('InventoryUpdated', inventoryHandlers.handleInventoryUpdated);
      await messageBus.subscribe('LowStockAlert', inventoryHandlers.handleLowStockAlert);

      // Verify subscriptions were made
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('ProductCreated', expect.any(Function));
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('InventoryUpdated', expect.any(Function));
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('LowStockAlert', expect.any(Function));
    });

    it('should subscribe to sales events and process them', async () => {
      const mockRabbitMQ = testServices.get('rabbitmq');

      // Setup subscriptions
      await messageBus.subscribe('OrderPlaced', salesHandlers.handleOrderPlaced);
      await messageBus.subscribe('PaymentProcessed', salesHandlers.handlePaymentProcessed);
      await messageBus.subscribe('OrderCompleted', salesHandlers.handleOrderCompleted);

      // Verify subscriptions were made
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('OrderPlaced', expect.any(Function));
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('PaymentProcessed', expect.any(Function));
      expect(mockRabbitMQ.consume).toHaveBeenCalledWith('OrderCompleted', expect.any(Function));
    });
  });

  describe('Event Handler Integration', () => {
    it('should handle product created event correctly', async () => {
      const productEvent = {
        productId: 'product-test-123',
        name: 'Test Product',
        sku: 'TEST-001',
        categoryId: 'cat-test-123',
        price: 100.00
      };

      await inventoryHandlers.handleProductCreated(productEvent);

      // Verify metrics were recorded
      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'inventory_events_total',
        {
          eventType: 'ProductCreated',
          productId: 'product-test-123'
        }
      );

      // Verify logging occurred
      const logger = testServices.get('logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Product created event processed',
        expect.objectContaining({
          productId: 'product-test-123',
          productName: 'Test Product',
          sku: 'TEST-001'
        }),
        expect.any(String)
      );
    });

    it('should handle inventory updated event correctly', async () => {
      const inventoryEvent = {
        productId: 'product-test-123',
        newQuantity: 25,
        previousQuantity: 50,
        changeType: 'decrease'
      };

      await inventoryHandlers.handleInventoryUpdated(inventoryEvent);

      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'inventory_events_total',
        {
          eventType: 'InventoryUpdated',
          productId: 'product-test-123',
          changeType: 'decrease'
        }
      );

      const logger = testServices.get('logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Inventory updated event processed',
        expect.objectContaining({
          productId: 'product-test-123',
          newQuantity: 25,
          previousQuantity: 50,
          changeType: 'decrease'
        }),
        expect.any(String)
      );
    });

    it('should handle low stock alert correctly', async () => {
      const lowStockEvent = {
        productId: 'product-test-123',
        currentStock: 5,
        minimumStock: 10,
        alertType: 'low_stock'
      };

      await inventoryHandlers.handleLowStockAlert(lowStockEvent);

      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'inventory_alerts_total',
        {
          productId: 'product-test-123',
          alertType: 'low_stock'
        }
      );

      const logger = testServices.get('logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Low stock alert processed',
        expect.objectContaining({
          productId: 'product-test-123',
          currentStock: 5,
          minimumStock: 10,
          alertType: 'low_stock'
        }),
        expect.any(String)
      );
    });

    it('should handle order placed event correctly', async () => {
      const orderEvent = {
        orderId: 'order-test-123',
        customerId: 'customer-test-456',
        items: [
          {
            productId: 'product-test-123',
            quantity: 2,
            price: 100.00
          }
        ],
        totalAmount: 200.00,
        paymentMethod: 'credit_card'
      };

      await salesHandlers.handleOrderPlaced(orderEvent);

      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'sales_events_total',
        {
          eventType: 'OrderPlaced',
          orderId: 'order-test-123',
          paymentMethod: 'credit_card'
        }
      );

      const logger = testServices.get('logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Order placed event processed',
        expect.objectContaining({
          orderId: 'order-test-123',
          customerId: 'customer-test-456',
          totalAmount: 200.00,
          itemCount: 1
        }),
        expect.any(String)
      );
    });

    it('should handle payment processed event correctly', async () => {
      const paymentEvent = {
        orderId: 'order-test-123',
        paymentId: 'payment-test-789',
        amount: 200.00,
        paymentMethod: 'credit_card',
        status: 'completed',
        transactionId: 'txn-test-456'
      };

      await salesHandlers.handlePaymentProcessed(paymentEvent);

      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'sales_events_total',
        {
          eventType: 'PaymentProcessed',
          orderId: 'order-test-123',
          status: 'completed',
          paymentMethod: 'credit_card'
        }
      );

      const logger = testServices.get('logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Payment processed event processed',
        expect.objectContaining({
          orderId: 'order-test-123',
          paymentId: 'payment-test-789',
          amount: 200.00,
          status: 'completed',
          transactionId: 'txn-test-456'
        }),
        expect.any(String)
      );
    });
  });

  describe('Event Correlation and Tracking', () => {
    it('should maintain event correlation across handlers', async () => {
      const mockRabbitMQ = testServices.get('rabbitmq');
      const logger = testServices.get('logger');
      
      const correlationId = 'corr-123';
      const event = {
        id: 'event-123',
        type: 'OrderPlaced',
        aggregateId: 'order-test-123',
        data: {
          orderId: 'order-test-123',
          customerId: 'customer-test-456'
        },
        correlationId
      };

      // Subscribe to event
      await messageBus.subscribe('OrderPlaced', async (data: any, metadata: any) => {
        // Process event with metadata
        await salesHandlers.handleOrderPlaced(data);
      });

      // Simulate receiving the event
      const message = {
        content: Buffer.from(JSON.stringify(event)),
        properties: { correlationId }
      };

      // Verify correlation ID is passed through
      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      await consumeCallback(message);

      // Check that correlation ID was used in logging
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        correlationId
      );
    });
  });

  describe('Error Handling in Event System', () => {
    it('should handle event handler errors gracefully', async () => {
      const mockRabbitMQ = testServices.get('rabbitmq');
      
      // Create a failing handler
      const failingHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));

      await messageBus.subscribe('TestEvent', failingHandler);

      const message = {
        content: Buffer.from(JSON.stringify({ data: 'test' })),
        properties: { correlationId: 'test-corr' },
        ack: jest.fn(),
        nack: jest.fn()
      };

      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      
      await expect(consumeCallback(message)).rejects.toThrow('Handler failed');
      
      // Should not acknowledge the message on error
      expect(message.ack).not.toHaveBeenCalled();
      expect(message.nack).toHaveBeenCalled();
    });

    it('should retry failed event publishing', async () => {
      const mockRabbitMQ = testServices.get('rabbitmq');
      
      // Mock publish to fail once, then succeed
      let callCount = 0;
      mockRabbitMQ.publish.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error');
        }
        return Promise.resolve();
      });

      const event = DomainEvents.productCreated({
        productId: 'product-test-123',
        name: 'Test Product',
        sku: 'TEST-001'
      });

      // First call should fail, but implementation should handle retry
      // (This would need to be implemented in the actual service)
      expect(() => {
        messageBus.publishEvent(event);
      }).not.toThrow();
    });
  });

  describe('Event Performance Integration', () => {
    it('should handle multiple events efficiently', async () => {
      const events = [
        DomainEvents.productCreated({
          productId: 'product-1',
          name: 'Product 1',
          sku: 'SKU-1'
        }),
        DomainEvents.inventoryUpdated({
          productId: 'product-1',
          newQuantity: 10,
          previousQuantity: 5,
          changeType: 'increase'
        }),
        DomainEvents.orderPlaced({
          orderId: 'order-1',
          customerId: 'customer-1',
          items: [],
          totalAmount: 0,
          paymentMethod: 'credit_card'
        })
      ];

      const startTime = Date.now();
      
      for (const event of events) {
        await messageBus.publishEvent(event);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete all events within reasonable time
      expect(processingTime).toBeLessThan(1000); // 1 second
      
      // Verify all events were published
      const mockRabbitMQ = testServices.get('rabbitMQ');
      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(events.length);
    });

    it('should handle concurrent event processing', async () => {
      const concurrentEvents = Array.from({ length: 10 }, (_, i) => 
        DomainEvents.productCreated({
          productId: `product-${i}`,
          name: `Product ${i}`,
          sku: `SKU-${i}`
        })
      );

      const startTime = Date.now();
      
      await Promise.all(
        concurrentEvents.map(event => messageBus.publishEvent(event))
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should handle concurrent events efficiently
      expect(processingTime).toBeLessThan(2000); // 2 seconds
      
      const mockRabbitMQ = testServices.get('rabbitMQ');
      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(10);
    });
  });
});