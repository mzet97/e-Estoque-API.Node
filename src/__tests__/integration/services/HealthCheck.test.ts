import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HealthCheckService } from '../../../../shared/services/HealthCheckService';
import { HealthCheckEndpoints } from '../../../../shared/services/HealthCheckEndpoints';
import { testServices } from '../../mocks/mock-services';
import { setupTestEnvironment, teardownTestEnvironment, makeRequest, createExpressTestApp } from '../../utils/test-runner';
import express from 'express';

describe('Health Check Integration Tests', () => {
  let healthCheckService: HealthCheckService;
  let healthCheckEndpoints: HealthCheckEndpoints;
  let app: express.Application;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    healthCheckService = new HealthCheckService({
      serviceName: 'e-estoque-test',
      environment: 'test'
    });
    healthCheckEndpoints = new HealthCheckEndpoints(healthCheckService);
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Service Integration', () => {
    it('should perform comprehensive health check', async () => {
      const healthStatus = await healthCheckService.checkHealth();

      expect(healthStatus).toEqual(expect.objectContaining({
        status: 'healthy',
        checks: expect.objectContaining({
          database: expect.objectContaining({
            status: 'up'
          }),
          redis: expect.objectContaining({
            status: 'up'
          }),
          rabbitmq: expect.objectContaining({
            status: 'up'
          })
        }),
        timestamp: expect.any(String)
      }));
    });

    it('should perform detailed health check', async () => {
      const detailedHealth = await healthCheckService.checkDetailedHealth();

      expect(detailedHealth).toEqual(expect.objectContaining({
        status: 'healthy',
        checks: expect.objectContaining({
          database: expect.objectContaining({
            status: 'up',
            responseTime: expect.any(Number),
            details: expect.any(Object)
          }),
          redis: expect.objectContaining({
            status: 'up',
            responseTime: expect.any(Number)
          }),
          rabbitmq: expect.objectContaining({
            status: 'up',
            responseTime: expect.any(Number)
          }),
          memory: expect.objectContaining({
            status: 'up',
            usedHeapSize: expect.any(Number),
            totalHeapSize: expect.any(Number),
            heapSizeLimit: expect.any(Number)
          }),
          uptime: expect.objectContaining({
            status: 'up',
            processUptime: expect.any(Number),
            systemUptime: expect.any(Number)
          })
        }),
        timestamp: expect.any(String),
        systemInfo: expect.objectContaining({
          platform: expect.any(String),
          nodeVersion: expect.any(String),
          environment: 'test'
        })
      }));
    });

    it('should add custom health checks', async () => {
      const customCheck = jest.fn().mockResolvedValue({
        status: 'healthy',
        details: { message: 'Custom service is running' }
      });

      await healthCheckService.addCustomCheck('custom-service', customCheck);

      const healthStatus = await healthCheckService.checkHealth();

      expect(healthStatus.checks['custom-service']).toEqual(expect.objectContaining({
        status: 'healthy',
        details: { message: 'Custom service is running' }
      }));

      expect(customCheck).toHaveBeenCalled();
    });

    it('should handle failing custom health checks', async () => {
      const failingCheck = jest.fn().mockRejectedValue(new Error('Custom service down'));

      await healthCheckService.addCustomCheck('failing-service', failingCheck);

      const healthStatus = await healthCheckService.checkHealth();

      expect(healthStatus.checks['failing-service']).toEqual(expect.objectContaining({
        status: 'down',
        error: 'Custom service down'
      }));
    });
  });

  describe('Health Check Endpoints Integration', () => {
    beforeEach(() => {
      healthCheckEndpoints.setupRoutes(app);
    });

    it('should setup health check routes correctly', () => {
      const routes = app._router.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => layer.route.path);

      expect(routes).toContain('/health');
      expect(routes).toContain('/health/detailed');
      expect(routes).toContain('/health/live');
      expect(routes).toContain('/health/ready');
      expect(routes).toContain('/health/started');
    });

    it('should respond to /health endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String)
      }));
    });

    it('should respond to /health/detailed endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'healthy',
        checks: expect.any(Object),
        systemInfo: expect.objectContaining({
          platform: expect.any(String),
          nodeVersion: expect.any(String)
        })
      }));
    });

    it('should respond to /health/live endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'alive'
      }));
    });

    it('should respond to /health/ready endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'ready'
      }));
    });

    it('should respond to /health/started endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/health/started');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'started',
        startTime: expect.any(String)
      }));
    });

    it('should return 503 status for unhealthy service', async () => {
      // Mock health service to return unhealthy
      const mockUnhealthyService = {
        checkHealth: jest.fn().mockResolvedValue({
          status: 'unhealthy',
          checks: {
            database: { status: 'down', error: 'Connection failed' }
          },
          timestamp: new Date().toISOString()
        })
      };

      const unhealthyEndpoints = new HealthCheckEndpoints(mockUnhealthyService as any);
      const unhealthyApp = express();
      unhealthyApp.use(express.json());
      unhealthyEndpoints.setupRoutes(unhealthyApp);

      const response = await makeRequest(unhealthyApp, 'GET', '/health');

      expect(response.status).toBe(503);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'unhealthy'
      }));
    });

    it('should include cache headers in responses', async () => {
      const response = await makeRequest(app, 'GET', '/health');

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    });

    it('should include correlation ID in response headers', async () => {
      const response = await makeRequest(app, 'GET', '/health', {
        headers: { 'X-Correlation-ID': 'test-correlation-123' }
      });

      expect(response.headers['x-correlation-id']).toBe('test-correlation-123');
    });
  });

  describe('Database Health Check Integration', () => {
    it('should check database connectivity', async () => {
      const dbCheck = await healthCheckService['checkDatabase']();

      expect(dbCheck).toEqual(expect.objectContaining({
        status: 'up',
        responseTime: expect.any(Number)
      }));
    });

    it('should handle database connection errors', async () => {
      // Mock database connection failure
      const failingHealthService = new HealthCheckService({
        serviceName: 'e-estoque-test',
        environment: 'test'
      });

      const dbCheck = await failingHealthService['checkDatabase']();

      expect(dbCheck).toEqual(expect.objectContaining({
        status: 'down',
        error: expect.any(String)
      }));
    });
  });

  describe('Redis Health Check Integration', () => {
    it('should check Redis connectivity', async () => {
      const redisCheck = await healthCheckService['checkRedis']();

      expect(redisCheck).toEqual(expect.objectContaining({
        status: 'up',
        responseTime: expect.any(Number)
      }));
    });
  });

  describe('RabbitMQ Health Check Integration', () => {
    it('should check RabbitMQ connectivity', async () => {
      const rabbitCheck = await healthCheckService['checkRabbitMQ']();

      expect(rabbitCheck).toEqual(expect.objectContaining({
        status: 'up',
        responseTime: expect.any(Number)
      }));
    });
  });

  describe('System Resource Health Check Integration', () => {
    it('should check memory usage', async () => {
      const memoryCheck = await healthCheckService['checkMemoryUsage']();

      expect(memoryCheck).toEqual(expect.objectContaining({
        status: 'up',
        usedHeapSize: expect.any(Number),
        totalHeapSize: expect.any(Number),
        heapSizeLimit: expect.any(Number),
        external: expect.any(Number),
        rss: expect.any(Number)
      }));

      expect(memoryCheck.usedHeapSize).toBeGreaterThanOrEqual(0);
      expect(memoryCheck.totalHeapSize).toBeGreaterThanOrEqual(0);
    });

    it('should check uptime', async () => {
      const uptimeCheck = await healthCheckService['checkUptime']();

      expect(uptimeCheck).toEqual(expect.objectContaining({
        status: 'up',
        processUptime: expect.any(Number),
        systemUptime: expect.any(Number)
      }));

      expect(uptimeCheck.processUptime).toBeGreaterThan(0);
      expect(uptimeCheck.systemUptime).toBeGreaterThan(0);
    });

    it('should check event loop lag', async () => {
      const eventLoopCheck = await healthCheckService['checkEventLoopLag']();

      expect(eventLoopCheck).toEqual(expect.objectContaining({
        status: 'up',
        lag: expect.any(Number)
      }));

      expect(eventLoopCheck.lag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Health Checks', () => {
    it('should monitor response times', async () => {
      const startTime = Date.now();
      const healthStatus = await healthCheckService.checkHealth();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(healthStatus.timestamp).toBeDefined();
    });

    it('should handle concurrent health checks', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(healthCheckService.checkHealth());
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toEqual(expect.objectContaining({
          status: expect.stringMatching(/healthy|unhealthy|degraded/)
        }));
      });
    });
  });
});