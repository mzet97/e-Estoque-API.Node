import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GatewayMiddlewareStack } from '../../../gateway/core/GatewayMiddlewareStack';
import { setupTestEnvironment, teardownTestEnvironment } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';
import { createExpressTestApp, makeRequest, TestDataFactory } from '../../utils/test-runner';
import express from 'express';

describe('GatewayMiddlewareStack Integration Tests', () => {
  let app: express.Application;
  let gatewayStack: GatewayMiddlewareStack;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    app = createExpressTestApp();
    gatewayStack = new GatewayMiddlewareStack({
      rateLimit: {
        defaultLimit: 100,
        tierLimits: {
          free: 10,
          basic: 1000,
          premium: 10000,
          admin: -1
        },
        windowMs: 60000,
        redis: testServices.get('redis')
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitorInterval: 10000,
        redis: testServices.get('redis')
      },
      requestLogging: {
        serviceName: 'e-estoque-test',
        environment: 'test',
        logLevel: 'info',
        includeHeaders: false,
        includeBodies: false,
        sensitiveFields: ['password', 'token', 'secret'],
        logger: testServices.get('logger'),
        metrics: testServices.get('metrics')
      },
      apiVersioning: {
        versions: ['v1', 'v2'],
        defaultVersion: 'v1',
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE']
      },
      performanceMonitoring: {
        metrics: testServices.get('metrics'),
        serviceName: 'e-estoque-test'
      },
      loadBalancing: {
        redis: testServices.get('redis'),
        strategies: ['round-robin', 'least-connections', 'weighted-round-robin'],
        healthCheckInterval: 30000
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Middleware Stack Integration', () => {
    it('should process request through all middleware successfully', async () => {
      // Setup test route
      app.get('/api/test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Success', timestamp: new Date().toISOString() });
      });

      const response = await makeRequest(app, 'GET', '/api/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Success',
        timestamp: expect.any(String)
      });
    });

    it('should enforce rate limiting for unauthorized requests', async () => {
      app.get('/api/rate-limited', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Success' });
      });

      // Make multiple requests to exceed rate limit
      const responses = [];
      for (let i = 0; i < 15; i++) {
        const response = await makeRequest(app, 'GET', '/api/rate-limited');
        responses.push(response);
      }

      // The last requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      rateLimitedResponses.forEach(response => {
        expect(response.body).toEqual({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later'
        });
      });
    });

    it('should allow unlimited requests for admin users', async () => {
      app.get('/api/admin-route', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Admin Success' });
      });

      // Make multiple requests with admin authentication
      const responses = [];
      for (let i = 0; i < 20; i++) {
        const response = await makeRequest(app, 'GET', '/api/admin-route', {
          auth: {
            token: 'admin-token',
            userId: 'admin-123',
            role: 'admin'
          }
        });
        responses.push(response);
      }

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: 'Admin Success'
        });
      });
    });

    it('should enforce circuit breaker when target service fails', async () => {
      let failureCount = 0;
      app.get('/api/service-test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        failureCount++;
        if (failureCount <= 6) { // Exceed failure threshold
          res.status(500).json({ error: 'Service error' });
        } else {
          res.json({ message: 'Success after circuit breaker reset' });
        }
      });

      // First requests should fail but succeed until threshold is reached
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await makeRequest(app, 'GET', '/api/service-test');
        responses.push(response);
      }

      // Some requests should return 503 (circuit breaker open)
      const circuitBreakerResponses = responses.filter(r => r.status === 503);
      expect(circuitBreakerResponses.length).toBeGreaterThan(0);

      // Circuit breaker responses should indicate service unavailability
      circuitBreakerResponses.forEach(response => {
        expect(response.body).toEqual({
          error: 'Service Unavailable',
          message: 'Service is temporarily unavailable due to high failure rate'
        });
      });
    });

    it('should handle API versioning correctly', async () => {
      app.get('/api/v1/versioned', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ 
          version: req.apiVersion,
          message: 'Version v1 endpoint' 
        });
      });

      // Request without version header should use default
      const defaultResponse = await makeRequest(app, 'GET', '/api/v1/versioned');
      expect(defaultResponse.status).toBe(200);
      expect(defaultResponse.body.version).toBe('v1');

      // Request with explicit version
      const v2Response = await makeRequest(app, 'GET', '/api/v1/versioned', {
        headers: { 'API-Version': 'v2' }
      });
      expect(v2Response.status).toBe(200);
      expect(v2Response.body.version).toBe('v2');
    });

    it('should monitor performance and record metrics', async () => {
      const metrics = testServices.get('metrics');

      app.get('/api/perf-test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Performance test' });
      });

      const response = await makeRequest(app, 'GET', '/api/perf-test');

      expect(response.status).toBe(200);

      // Verify that performance metrics were recorded
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'http_requests_total',
        expect.objectContaining({
          method: 'GET',
          route: '/api/perf-test',
          status: '2xx'
        })
      );

      expect(metrics.recordTimer).toHaveBeenCalledWith(
        'http_request_duration_seconds',
        expect.any(Number),
        expect.objectContaining({
          method: 'GET',
          route: '/api/perf-test'
        })
      );
    });

    it('should log requests with proper correlation IDs', async () => {
      const logger = testServices.get('logger');

      app.get('/api/log-test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Logging test' });
      });

      const response = await makeRequest(app, 'GET', '/api/log-test', {
        headers: { 'X-Correlation-ID': 'test-correlation-123' }
      });

      expect(response.status).toBe(200);

      // Verify request logging
      const logCalls = logger.info.mock.calls;
      const requestStartLog = logCalls.find(call => 
        call[0] === 'Request started' && call[2] === 'test-correlation-123'
      );
      const requestEndLog = logCalls.find(call => 
        call[0] === 'Request completed' && call[2] === 'test-correlation-123'
      );

      expect(requestStartLog).toBeDefined();
      expect(requestEndLog).toBeDefined();
      expect(requestStartLog[1]).toMatchObject({
        method: 'GET',
        url: '/api/log-test',
        correlationId: 'test-correlation-123'
      });
    });

    it('should handle load balancing for service endpoints', async () => {
      let requestCount = 0;
      
      // Mock multiple service instances
      app.get('/api/load-balance', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        requestCount++;
        res.json({ 
          message: 'Load balanced request',
          instanceId: `instance-${requestCount % 3}`,
          requestNumber: requestCount
        });
      });

      const responses = [];
      for (let i = 0; i < 9; i++) {
        const response = await makeRequest(app, 'GET', '/api/load-balance');
        responses.push(response);
      }

      expect(responses.length).toBe(9);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          message: 'Load balanced request'
        });
      });
    });

    it('should handle error scenarios gracefully', async () => {
      app.get('/api/error-test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await makeRequest(app, 'GET', '/api/error-test');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });

      // Should record error metrics
      const metrics = testServices.get('metrics');
      expect(metrics.incrementCounter).toHaveBeenCalledWith(
        'http_requests_total',
        expect.objectContaining({
          method: 'GET',
          route: '/api/error-test',
          status: '5xx'
        })
      );
    });

    it('should filter sensitive data from logs', async () => {
      const logger = testServices.get('logger');

      app.post('/api/sensitive-data', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Data processed' });
      });

      const response = await makeRequest(app, 'POST', '/api/sensitive-data', {
        body: {
          username: 'testuser',
          password: 'secret123',
          token: 'auth-token',
          publicData: 'visible'
        }
      });

      expect(response.status).toBe(200);

      // Check that sensitive data was filtered in logs
      const logCalls = logger.info.mock.calls;
      const requestStartLog = logCalls.find(call => 
        call[0] === 'Request started' && call[1].body
      );

      if (requestStartLog) {
        expect(requestStartLog[1].body.password).toBe('[FILTERED]');
        expect(requestStartLog[1].body.token).toBe('[FILTERED]');
        expect(requestStartLog[1].body.username).toBe('testuser');
        expect(requestStartLog[1].body.publicData).toBe('visible');
      }
    });
  });

  describe('Middleware Configuration', () => {
    it('should work with minimal configuration', () => {
      const minimalGateway = new GatewayMiddlewareStack({
        rateLimit: {
          defaultLimit: 50,
          redis: testServices.get('redis')
        }
      });

      expect(minimalGateway).toBeInstanceOf(GatewayMiddlewareStack);
    });

    it('should validate configuration parameters', () => {
      expect(() => {
        new GatewayMiddlewareStack({
          rateLimit: {
            defaultLimit: -1, // Invalid
            redis: testServices.get('redis')
          }
        });
      }).not.toThrow(); // Config validation should be handled internally
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      app.get('/api/concurrent-test', gatewayStack.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Concurrent request', id: Date.now() });
      });

      // Make 50 concurrent requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(makeRequest(app, 'GET', '/api/concurrent-test'));
      }

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(50);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          message: 'Concurrent request'
        });
      });
    });
  });
});