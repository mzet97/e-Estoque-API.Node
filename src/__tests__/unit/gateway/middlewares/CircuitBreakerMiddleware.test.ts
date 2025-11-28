import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CircuitBreakerMiddleware } from '../../../gateway/middlewares/CircuitBreakerMiddleware';
import { createMockRequest, createMockResponse, cleanupMocks } from '../../utils/test-utils';
import { testServices } from '../../mocks/mock-services';

describe('CircuitBreakerMiddleware', () => {
  let circuitBreakerMiddleware: CircuitBreakerMiddleware;
  let mockRedis: any;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    circuitBreakerMiddleware = new CircuitBreakerMiddleware({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitorInterval: 10000,
      redis: testServices.get('redis')
    });
    
    mockRedis = testServices.get('redis');
    mockRequest = createMockRequest({
      url: '/api/test',
      method: 'GET'
    });
    mockResponse = createMockResponse();
    mockNext = jest.fn();
    mockExecute = jest.fn();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(circuitBreakerMiddleware['failureThreshold']).toBe(5);
      expect(circuitBreakerMiddleware['resetTimeout']).toBe(60000);
      expect(circuitBreakerMiddleware['monitorInterval']).toBe(10000);
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      circuitBreakerMiddleware.execute = mockExecute;
    });

    it('should allow requests when circuit is closed', async () => {
      mockRedis.hgetall.mockResolvedValue({ state: 'CLOSED' });
      mockRedis.hincrby.mockResolvedValue(1);
      
      mockExecute.mockImplementation(() => Promise.resolve());

      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockExecute).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockRedis.hgetall).toHaveBeenCalledWith('circuit_breaker:/api/test:GET');
    });

    it('should reject requests when circuit is open', async () => {
      mockRedis.hgetall.mockResolvedValue({ state: 'OPEN', openedAt: Date.now().toString() });
      mockRedis.hset.mockResolvedValue(1);
      
      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Service is temporarily unavailable due to high failure rate',
        retryAfter: expect.any(Number)
      });
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should allow requests in half-open state', async () => {
      const halfOpenTime = Date.now() - 70000; // 70 seconds ago
      mockRedis.hgetall.mockResolvedValue({ 
        state: 'OPEN', 
        openedAt: halfOpenTime.toString() 
      });
      mockRedis.hset.mockResolvedValue(1);
      mockExecute.mockImplementation(() => Promise.resolve());

      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'state', 
        'HALF_OPEN'
      );
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should handle errors and update circuit state', async () => {
      mockRedis.hgetall.mockResolvedValue({ state: 'CLOSED', failures: '0', lastFailureAt: '' });
      mockRedis.hincrby.mockResolvedValue(1);
      mockRedis.hset.mockResolvedValue(1);

      const error = new Error('Test error');
      mockExecute.mockRejectedValue(error);

      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'failures', 
        1
      );
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should open circuit after threshold failures', async () => {
      mockRedis.hgetall.mockResolvedValue({ 
        state: 'CLOSED', 
        failures: '4', 
        lastFailureAt: Date.now().toString() 
      });
      mockRedis.hincrby.mockResolvedValue(5);
      mockRedis.hset.mockResolvedValue(1);

      const error = new Error('Test error');
      mockExecute.mockRejectedValue(error);

      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'state', 
        'OPEN'
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis error'));
      mockExecute.mockImplementation(() => Promise.resolve());

      await circuitBreakerMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should reset circuit on success', async () => {
      mockRedis.hgetall.mockResolvedValue({ state: 'HALF_OPEN', failures: '3' });
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.hdel.mockResolvedValue(1);

      circuitBreakerMiddleware['success'](mockRequest, mockResponse);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'state', 
        'CLOSED'
      );
      expect(mockRedis.hdel).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'failures'
      );
    });

    it('should handle errors in success method', async () => {
      mockRedis.hset.mockRejectedValue(new Error('Redis error'));

      expect(() => {
        circuitBreakerMiddleware['success'](mockRequest, mockResponse);
      }).not.toThrow();
    });
  });

  describe('failure', () => {
    it('should increment failure count', async () => {
      mockRedis.hincrby.mockResolvedValue(1);
      mockRedis.hset.mockResolvedValue(1);

      const error = new Error('Test error');
      circuitBreakerMiddleware['failure'](error, mockRequest, mockResponse);

      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET', 
        'failures', 
        1
      );
    });

    it('should record failure timestamp', async () => {
      mockRedis.hincrby.mockResolvedValue(1);
      mockRedis.hset.mockResolvedValue(1);

      const error = new Error('Test error');
      circuitBreakerMiddleware['failure'](error, mockRequest, mockResponse);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        'circuit_breaker:/api/test:GET',
        'lastFailureAt',
        expect.any(String)
      );
    });
  });

  describe('getCircuitKey', () => {
    it('should generate correct circuit breaker key', () => {
      const key = circuitBreakerMiddleware['getCircuitKey'](mockRequest);
      expect(key).toBe('circuit_breaker:/api/test:GET');
    });
  });

  describe('shouldOpenCircuit', () => {
    it('should return true when failure threshold is reached', () => {
      expect(circuitBreakerMiddleware['shouldOpenCircuit'](5)).toBe(true);
      expect(circuitBreakerMiddleware['shouldOpenCircuit'](6)).toBe(true);
    });

    it('should return false when failure threshold is not reached', () => {
      expect(circuitBreakerMiddleware['shouldOpenCircuit'](4)).toBe(false);
      expect(circuitBreakerMiddleware['shouldOpenCircuit'](0)).toBe(false);
    });
  });

  describe('shouldAttemptReset', () => {
    it('should return true when reset timeout has passed', () => {
      const openedAt = Date.now() - 70000; // 70 seconds ago
      expect(circuitBreakerMiddleware['shouldAttemptReset'](openedAt)).toBe(true);
    });

    it('should return false when reset timeout has not passed', () => {
      const openedAt = Date.now() - 30000; // 30 seconds ago
      expect(circuitBreakerMiddleware['shouldAttemptReset'](openedAt)).toBe(false);
    });

    it('should return false for invalid openedAt', () => {
      expect(circuitBreakerMiddleware['shouldAttemptReset'](0)).toBe(false);
      expect(circuitBreakerMiddleware['shouldAttemptReset'](null)).toBe(false);
      expect(circuitBreakerMiddleware['shouldAttemptReset']('')).toBe(false);
    });
  });
});