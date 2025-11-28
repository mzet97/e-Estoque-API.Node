import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RequestLoggingMiddleware } from '../../../gateway/middlewares/RequestLoggingMiddleware';
import { createMockRequest, createMockResponse, cleanupMocks } from '../../utils/test-utils';
import { testServices } from '../../mocks/mock-services';

describe('RequestLoggingMiddleware', () => {
  let requestLoggingMiddleware: RequestLoggingMiddleware;
  let mockLogger: any;
  let mockMetrics: any;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;
  let originalDate: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDate = global.Date;
    global.Date = {
      now: jest.fn().mockReturnValue(1000000000000),
      ...originalDate
    };

    requestLoggingMiddleware = new RequestLoggingMiddleware({
      serviceName: 'e-estoque-test',
      environment: 'test',
      logLevel: 'info',
      includeHeaders: false,
      includeBodies: false,
      sensitiveFields: ['password', 'token', 'secret'],
      logger: testServices.get('logger'),
      metrics: testServices.get('metrics')
    });

    mockLogger = testServices.get('logger');
    mockMetrics = testServices.get('metrics');
    mockRequest = createMockRequest({
      method: 'POST',
      url: '/api/test',
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'test-browser',
        'authorization': 'Bearer secret-token',
        'x-correlation-id': 'correlation-123'
      },
      body: {
        username: 'testuser',
        password: 'secret123',
        data: 'public data'
      }
    });
    mockResponse = createMockResponse();
    mockNext = jest.fn();
  });

  afterEach(() => {
    global.Date = originalDate;
    cleanupMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(requestLoggingMiddleware['serviceName']).toBe('e-estoque-test');
      expect(requestLoggingMiddleware['environment']).toBe('test');
      expect(requestLoggingMiddleware['logLevel']).toBe('info');
      expect(requestLoggingMiddleware['includeHeaders']).toBe(false);
      expect(requestLoggingMiddleware['includeBodies']).toBe(false);
      expect(requestLoggingMiddleware['sensitiveFields']).toEqual(['password', 'token', 'secret']);
    });
  });

  describe('execute', () => {
    it('should log request start and response end', async () => {
      mockNext.mockImplementation(() => {
        mockResponse.status = jest.fn().mockReturnThis();
        mockResponse.json = jest.fn().mockReturnThis();
        mockResponse.end = jest.fn().mockReturnThis();
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          method: 'POST',
          url: '/api/test',
          userId: 'test-user',
          correlationId: 'correlation-123',
          ip: '192.168.1.1',
          userAgent: 'test-browser'
        }),
        'correlation-123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'POST',
          url: '/api/test',
          statusCode: 200,
          responseTime: expect.any(Number),
          userId: 'test-user',
          correlationId: 'correlation-123'
        }),
        'correlation-123'
      );
    });

    it('should handle errors and log them', async () => {
      const testError = new Error('Test error');
      mockNext.mockImplementation(() => {
        throw testError;
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed',
        testError,
        expect.objectContaining({
          method: 'POST',
          url: '/api/test',
          statusCode: 500,
          userId: 'test-user',
          correlationId: 'correlation-123'
        }),
        'correlation-123'
      );
    });

    it('should filter sensitive data from headers when includeHeaders is true', async () => {
      requestLoggingMiddleware = new RequestLoggingMiddleware({
        serviceName: 'e-estoque-test',
        environment: 'test',
        logLevel: 'info',
        includeHeaders: true,
        includeBodies: false,
        sensitiveFields: ['password', 'token', 'secret'],
        logger: mockLogger,
        metrics: mockMetrics
      });

      mockNext.mockImplementation(() => {
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      const firstCall = mockLogger.info.mock.calls.find(
        call => call[0] === 'Request started'
      );
      
      expect(firstCall[1].headers.authorization).toBe('[FILTERED]');
    });

    it('should filter sensitive data from body when includeBodies is true', async () => {
      requestLoggingMiddleware = new RequestLoggingMiddleware({
        serviceName: 'e-estoque-test',
        environment: 'test',
        logLevel: 'info',
        includeHeaders: false,
        includeBodies: true,
        sensitiveFields: ['password', 'token', 'secret'],
        logger: mockLogger,
        sensitiveKeys: ['password']
      });

      mockNext.mockImplementation(() => {
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      const firstCall = mockLogger.info.mock.calls.find(
        call => call[0] === 'Request started'
      );
      
      expect(firstCall[1].body.password).toBe('[FILTERED]');
      expect(firstCall[1].body.data).toBe('public data');
    });

    it('should record metrics for requests and responses', async () => {
      mockNext.mockImplementation(() => {
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith(
        'http_requests_total',
        {
          method: 'POST',
          route: '/api/test',
          status: '2xx',
          userId: 'test-user'
        }
      );

      expect(mockMetrics.recordTimer).toHaveBeenCalledWith(
        'http_request_duration_seconds',
        expect.any(Number),
        {
          method: 'POST',
          route: '/api/test'
        }
      );
    });

    it('should generate correlation ID when not provided', async () => {
      delete mockRequest.headers['x-correlation-id'];
      
      mockNext.mockImplementation(() => {
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          correlationId: expect.any(String)
        }),
        expect.any(String)
      );
    });

    it('should handle missing user gracefully', async () => {
      delete mockRequest.user;
      
      mockNext.mockImplementation(() => {
        mockResponse.status(200).json({ success: true });
      });

      await requestLoggingMiddleware.execute(mockRequest, mockResponse, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request started',
        expect.objectContaining({
          userId: null
        }),
        'correlation-123'
      );
    });
  });

  describe('filterSensitiveData', () => {
    it('should filter sensitive fields from object', () => {
      const data = {
        password: 'secret123',
        token: 'auth-token',
        username: 'testuser',
        nested: {
          secret: 'hidden-value',
          public: 'visible'
        }
      };

      const filtered = requestLoggingMiddleware['filterSensitiveData'](data);

      expect(filtered.password).toBe('[FILTERED]');
      expect(filtered.token).toBe('[FILTERED]');
      expect(filtered.username).toBe('testuser');
      expect(filtered.nested.secret).toBe('[FILTERED]');
      expect(filtered.nested.public).toBe('visible');
    });

    it('should handle null and undefined values', () => {
      expect(requestLoggingMiddleware['filterSensitiveData'](null)).toBeNull();
      expect(requestLoggingMiddleware['filterSensitiveData'](undefined)).toBeUndefined();
      expect(requestLoggingMiddleware['filterSensitiveData'](123)).toBe(123);
      expect(requestLoggingMiddleware['filterSensitiveData']('string')).toBe('string');
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = requestLoggingMiddleware['generateCorrelationId']();
      const id2 = requestLoggingMiddleware['generateCorrelationId']();

      expect(id1).toMatch(/^correlation-[a-f0-9]+$/);
      expect(id2).toMatch(/^correlation-[a-f0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('calculateResponseTime', () => {
    it('should calculate correct response time', () => {
      const startTime = 1000000000000;
      const endTime = 1000000000500; // 500ms later
      const responseTime = requestLoggingMiddleware['calculateResponseTime'](startTime, endTime);
      
      expect(responseTime).toBe(500);
    });

    it('should handle negative response times', () => {
      const startTime = 1000000000000;
      const endTime = 999999999500; // 500ms earlier
      const responseTime = requestLoggingMiddleware['calculateResponseTime'](startTime, endTime);
      
      expect(responseTime).toBe(0);
    });
  });
});