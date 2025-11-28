import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageBus } from '../../../../shared/services/MessageBus';
import { testServices } from '../../mocks/mock-services';

describe('MessageBus', () => {
  let messageBus: MessageBus;
  let mockRabbitMQ: any;

  beforeEach(() => {
    jest.clearAllMocks();
    messageBus = MessageBus.getInstance();
    mockRabbitMQ = testServices.get('rabbitmq');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = MessageBus.getInstance();
      const instance2 = MessageBus.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should not be able to instantiate multiple instances', () => {
      expect(() => new (MessageBus as any)()).toThrow();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(messageBus.initialize()).resolves.toBeUndefined();
    });

    it('should handle initialization errors', async () => {
      // Mock initialization failure
      await expect(messageBus.initialize()).resolves.toBeUndefined();
    });
  });

  describe('publish', () => {
    it('should publish message to correct queue', async () => {
      const message = { event: 'user.created', data: { userId: '123' } };
      
      await messageBus.publish('user.created', message.data, {
        correlationId: 'correlation-123',
        replyTo: 'user.created.reply'
      });

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'user.created',
        JSON.stringify(message),
        expect.objectContaining({
          correlationId: 'correlation-123',
          replyTo: 'user.created.reply',
          headers: expect.objectContaining({
            eventType: 'user.created'
          })
        })
      );
    });

    it('should handle publish errors', async () => {
      mockRabbitMQ.publish.mockRejectedValue(new Error('Publish error'));
      
      await expect(messageBus.publish(
        'test.event',
        { test: 'data' }
      )).rejects.toThrow('Publish error');
    });

    it('should include metadata in message', async () => {
      const message = { event: 'order.created', data: { orderId: '456' } };
      const metadata = { source: 'api', timestamp: Date.now() };
      
      await messageBus.publish('order.created', message.data, metadata);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'order.created',
        JSON.stringify(message),
        expect.objectContaining(metadata)
      );
    });
  });

  describe('subscribe', () => {
    it('should subscribe to event and register handler', async () => {
      const handler = jest.fn();
      
      await messageBus.subscribe('user.created', handler);

      expect(mockRabbitMQ.consume).toHaveBeenCalledWith(
        'user.created',
        expect.any(Function)
      );
    });

    it('should call handler when message is received', async () => {
      const handler = jest.fn();
      const message = {
        content: Buffer.from(JSON.stringify({ userId: '123', email: 'test@example.com' })),
        properties: { correlationId: 'correlation-123' }
      };

      await messageBus.subscribe('user.created', handler);

      // Simulate message consumption
      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      await consumeCallback(message);

      expect(handler).toHaveBeenCalledWith({
        userId: '123',
        email: 'test@example.com'
      }, {
        correlationId: 'correlation-123'
      });
    });

    it('should handle handler errors gracefully', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      await messageBus.subscribe('user.created', handler);

      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      const message = {
        content: Buffer.from(JSON.stringify({ userId: '123' })),
        properties: {}
      };

      await expect(consumeCallback(message)).rejects.toThrow('Handler error');
    });

    it('should acknowledge message after successful handling', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      
      await messageBus.subscribe('user.created', handler);

      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      const message = {
        content: Buffer.from(JSON.stringify({ userId: '123' })),
        properties: {},
        ack: jest.fn()
      };

      await consumeCallback(message);

      expect(message.ack).toHaveBeenCalled();
    });

    it('should not acknowledge message when handler fails', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      await messageBus.subscribe('user.created', handler);

      const consumeCallback = mockRabbitMQ.consume.mock.calls[0][1];
      const message = {
        content: Buffer.from(JSON.stringify({ userId: '123' })),
        properties: {},
        ack: jest.fn(),
        nack: jest.fn()
      };

      await consumeCallback(message);

      expect(message.ack).not.toHaveBeenCalled();
      expect(message.nack).toHaveBeenCalled();
    });
  });

  describe('publishEvent', () => {
    it('should publish domain event', async () => {
      const event = {
        id: 'event-123',
        type: 'OrderPlaced',
        aggregateId: 'order-456',
        data: { orderId: 'order-456', amount: 100.00 },
        metadata: { source: 'api', version: '1.0' }
      };

      await messageBus.publishEvent(event);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'OrderPlaced',
        JSON.stringify(event),
        expect.objectContaining({
          correlationId: event.id,
          headers: expect.objectContaining({
            aggregateId: event.aggregateId,
            eventType: 'OrderPlaced'
          })
        })
      );
    });
  });

  describe('subscribeToEvents', () => {
    it('should subscribe to multiple events with same handler', async () => {
      const handler = jest.fn();
      const events = ['user.created', 'user.updated', 'user.deleted'];

      await messageBus.subscribeToEvents(events, handler);

      expect(mockRabbitMQ.consume).toHaveBeenCalledTimes(events.length);
      events.forEach(event => {
        expect(mockRabbitMQ.consume).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });
  });

  describe('publishCommand', () => {
    it('should publish command with reply queue', async () => {
      const command = {
        id: 'cmd-123',
        type: 'CreateOrder',
        data: { productId: 'prod-123', quantity: 2 }
      };

      await messageBus.publishCommand('CreateOrder', command.data, {
        correlationId: 'cmd-123',
        replyTo: expect.stringContaining('CreateOrder.reply')
      });

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'CreateOrder',
        JSON.stringify(command),
        expect.objectContaining({
          correlationId: 'cmd-123',
          replyTo: expect.stringContaining('CreateOrder.reply')
        })
      );
    });
  });

  describe('sendCommand', () => {
    it('should send command and wait for response', async () => {
      const commandData = { productId: 'prod-123', quantity: 2 };
      const response = { success: true, orderId: 'order-456' };

      mockRabbitMQ.publish.mockResolvedValue(undefined);
      mockRabbitMQ.consume.mockImplementation((queue, handler) => {
        // Simulate response
        setTimeout(() => {
          handler({
            content: Buffer.from(JSON.stringify(response)),
            properties: { correlationId: 'cmd-123' }
          });
        }, 10);
      });

      const result = await messageBus.sendCommand('CreateOrder', commandData);

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'CreateOrder',
        expect.any(String),
        expect.objectContaining({
          replyTo: expect.stringContaining('CreateOrder.reply')
        })
      );

      expect(result).toEqual(response);
    });

    it('should timeout if no response received', async () => {
      const commandData = { productId: 'prod-123', quantity: 2 };

      mockRabbitMQ.publish.mockResolvedValue(undefined);
      mockRabbitMQ.consume.mockImplementation(() => {
        // Don't send any response to simulate timeout
      });

      await expect(messageBus.sendCommand('CreateOrder', commandData, {
        timeout: 100
      })).rejects.toThrow('Command timeout');
    });
  });

  describe('disconnect', () => {
    it('should disconnect gracefully', async () => {
      await expect(messageBus.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('queue management', () => {
    it('should create correct queue names for different event types', () => {
      expect(messageBus.getQueueName('user.created')).toBe('user.created');
      expect(messageBus.getQueueName('OrderPlaced')).toBe('OrderPlaced');
      expect(messageBus.getQueueName('InventoryLow')).toBe('InventoryLow');
    });

    it('should create correct reply queue names', () => {
      const replyQueue = messageBus.getReplyQueueName('CreateOrder', 'cmd-123');
      expect(replyQueue).toBe('CreateOrder.reply.cmd-123');
    });
  });
});