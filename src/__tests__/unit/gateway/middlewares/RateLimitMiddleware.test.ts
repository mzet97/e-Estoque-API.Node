import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimitMiddleware } from '../../../gateway/middlewares/RateLimitMiddleware';
import { createMockRequest, createMockResponse, cleanupMocks } from '../../utils/test-utils';
import { testServices } from '../../mocks/mock-services';

describe('RateLimitMiddleware', () => {
  let rateLimitMiddleware: RateLimitMiddleware;
  let mockRedis: any;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitMiddleware = new RateLimitMiddleware({
      defaultLimit: 100,
      tierLimits: {
        free: 10,
        basic: 1000,
        premium: 10000,
        admin: -1
      },
      windowMs: 60000,
      redis: testServices.get('redis')
    });
    
    mockRedis = testServices.get('redis');
    mockRequest = createMockRequest({
      ip: '192.168.1.1',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-browser'
      }
    });
    mockResponse = createMockResponse();
    mockNext = jest.fn();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(rateLimitMiddleware['defaultLimit']).toBe(100);
      expect(rateLimitMiddleware['tierLimits']).toEqual({
        free: 10,
        basic: 1000,
        premium: 10000,
        admin: -1
      });
      expect(rateLimitMiddleware['windowMs']).toBe(60000);
    });
  });

  describe('execute', () => {
    it('should allow requests within rate limit', async () => {
      mockRedis.get.mockResolvedValue('5');
      mockRedis.incr.mockResolvedValue(6);
      mockRedis.expire.mockResolvedValue(true);

      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:192.168.1.1');
      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:192.168.1.1', 60);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRedis.get.mockResolvedValue('10');
      mockRedis.incr.mockResolvedValue(11);

      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: expect.any(Number)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow admin users unlimited requests', async () => {
      mockRequest.user = { role: 'admin', id: 'admin-123' };
      
      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection error'));
      
      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should extract client IP correctly from headers', async () => {
      mockRequest.headers['x-forwarded-for'] = '10.0.0.1, 192.168.1.1';
      mockRedis.get.mockResolvedValue('5');
      mockRedis.incr.mockResolvedValue(6);

      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:10.0.0.1');
    });

    it('should extract client IP correctly from request.ip', async () => {
      mockRequest.ip = '172.16.0.1';
      mockRequest.headers = {};
      mockRedis.get.mockResolvedValue('5');
      mockRedis.incr.mockResolvedValue(6);

      await rateLimitMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:172.16.0.1');
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return correct limits based on user tier', () => {
      expect(rateLimitMiddleware['getRateLimitConfig']({ tier: 'free' }))
        .toEqual({ limit: 10, windowMs: 60000 });
      expect(rateLimitMiddleware['getRateLimitConfig']({ tier: 'basic' }))
        .toEqual({ limit: 1000, windowMs: 60000 });
      expect(rateLimitMiddleware['getRateLimitConfig']({ tier: 'premium' }))
        .toEqual({ limit: 10000, windowMs: 60000 });
      expect(rateLimitMiddleware['getRateLimitConfig']({ tier: 'admin' }))
        .toEqual({ limit: -1, windowMs: 60000 });
    });

    it('should return default limit for unknown tiers', () => {
      expect(rateLimitMiddleware['getRateLimitConfig']({ tier: 'unknown' }))
        .toEqual({ limit: 100, windowMs: 60000 });
      expect(rateLimitMiddleware['getRateLimitConfig']({}))
        .toEqual({ limit: 100, windowMs: 60000 });
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate correct rate limit key', () => {
      const key = rateLimitMiddleware['generateRateLimitKey']('test-key');
      expect(key).toBe('rate_limit:test-key');
    });
  });

  describe('parseCountFromResponse', () => {
    it('should parse count from response correctly', () => {
      expect(rateLimitMiddleware['parseCountFromResponse']('0')).toBe(0);
      expect(rateLimitMiddleware['parseCountFromResponse']('10')).toBe(10);
      expect(rateLimitMiddleware['parseCountFromResponse'](null)).toBe(0);
      expect(rateLimitMiddleware['parseCountFromResponse']('invalid')).toBe(0);
    });
  });
});