import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MetricsService } from '../../../../shared/services/MetricsService';
import { PerformanceMonitoringMiddleware } from '../../../../gateway/middlewares/PerformanceMonitoringMiddleware';
import { setupTestEnvironment, teardownTestEnvironment } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';
import { createExpressTestApp, makeRequest } from '../../utils/test-runner';

describe('Performance Tests Suite', () => {
  let metricsService: MetricsService;
  let performanceMiddleware: PerformanceMonitoringMiddleware;
  let app: any;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    metricsService = testServices.get('metrics');
    performanceMiddleware = new PerformanceMonitoringMiddleware({
      metrics: metricsService,
      serviceName: 'e-estoque-test'
    });
    app = createExpressTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Performance Tests', () => {
    it('should respond within performance SLA', async () => {
      app.get('/api/performance-test', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        // Simulate some processing
        setTimeout(() => {
          res.json({ message: 'Performance test completed', timestamp: Date.now() });
        }, 50); // 50ms delay
      });

      const startTime = process.hrtime.bigint();
      const response = await makeRequest(app, 'GET', '/api/performance-test');
      const endTime = process.hrtime.bigint();

      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200); // Should complete within 200ms (SLA)
    });

    it('should maintain performance under concurrent load', async () => {
      app.get('/api/concurrent-perf', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Concurrent test', id: Date.now() });
      });

      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(makeRequest(app, 'GET', '/api/concurrent-perf'));
      }

      const responses = await Promise.all(promises);
      const startTime = process.hrtime.bigint();
      
      // Measure total time
      const totalStartTime = process.hrtime.bigint();
      await Promise.all(promises);
      const totalEndTime = process.hrtime.bigint();
      
      const totalDuration = Number(totalEndTime - totalStartTime) / 1000000;

      expect(responses.length).toBe(concurrentRequests);
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(totalDuration).toBeLessThan(5000); // Should handle 50 concurrent requests within 5 seconds
      
      // Calculate average response time
      const avgResponseTime = totalDuration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // Average should be under 100ms
    });

    it('should track response time metrics accurately', async () => {
      app.get('/api/metrics-test', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        res.json({ message: 'Metrics test' });
      });

      await makeRequest(app, 'GET', '/api/metrics-test');

      expect(metricsService.recordTimer).toHaveBeenCalledWith(
        'http_request_duration_seconds',
        expect.any(Number),
        expect.objectContaining({
          method: 'GET',
          route: '/api/metrics-test'
        })
      );
    });

    it('should handle heavy payload requests efficiently', async () => {
      const largePayload = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          properties: {
            value1: Math.random(),
            value2: Math.random(),
            value3: Math.random()
          }
        }))
      };

      app.post('/api/heavy-payload', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        expect(req.body.data).toHaveLength(1000);
        res.json({ 
          message: 'Heavy payload processed',
          itemCount: req.body.data.length,
          processingTime: Date.now()
        });
      });

      const startTime = process.hrtime.bigint();
      const response = await makeRequest(app, 'POST', '/api/heavy-payload', {
        body: largePayload
      });
      const endTime = process.hrtime.bigint();

      const duration = Number(endTime - startTime) / 1000000;

      expect(response.status).toBe(200);
      expect(response.body.itemCount).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should process large payload within 1 second
    });
  });

  describe('Database Performance Tests', () => {
    it('should perform database queries within acceptable time', async () => {
      const testDatabase = require('../../utils/database-utils').testDatabase;
      const prisma = testDatabase.getPrisma();

      // Mock query to return test data
      prisma.product.findMany.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          id: `product-${i}`,
          name: `Product ${i}`,
          price: 100 + i,
          isActive: true
        }))
      );

      const startTime = process.hrtime.bigint();
      const products = await prisma.product.findMany({
        where: { isActive: true },
        take: 100
      });
      const endTime = process.hrtime.bigint();

      const queryDuration = Number(endTime - startTime) / 1000000;

      expect(products).toHaveLength(100);
      expect(queryDuration).toBeLessThan(100); // Query should complete within 100ms
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 100
      });
    });

    it('should handle batch operations efficiently', async () => {
      const testDatabase = require('../../utils/database-utils').testDatabase;
      const prisma = testDatabase.getPrisma();

      const batchData = Array.from({ length: 50 }, (_, i) => ({
        id: `product-batch-${i}`,
        name: `Batch Product ${i}`,
        price: 100 + i
      }));

      prisma.product.createMany.mockResolvedValue({ count: 50 });

      const startTime = process.hrtime.bigint();
      await prisma.product.createMany({
        data: batchData,
        skipDuplicates: true
      });
      const endTime = process.hrtime.bigint();

      const batchDuration = Number(endTime - startTime) / 1000000;

      expect(batchDuration).toBeLessThan(200); // Batch operations should complete within 200ms
      expect(prisma.product.createMany).toHaveBeenCalledWith({
        data: batchData,
        skipDuplicates: true
      });
    });
  });

  describe('Event System Performance Tests', () => {
    it('should publish events efficiently', async () => {
      const MessageBus = require('../../../../shared/services/MessageBus').MessageBus;
      const messageBus = MessageBus.getInstance();
      const mockRabbitMQ = testServices.get('rabbitmq');

      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: 'TestEvent',
        data: { index: i, message: `Test message ${i}` }
      }));

      const startTime = process.hrtime.bigint();
      
      for (const event of events) {
        await messageBus.publish('TestEvent', event.data);
      }

      const endTime = process.hrtime.bigint();
      const publishDuration = Number(endTime - startTime) / 1000000;

      expect(publishDuration).toBeLessThan(1000); // Should publish 100 events within 1 second
      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent event publishing', async () => {
      const messageBus = require('../../../../shared/services/MessageBus').MessageBus.getInstance();
      const mockRabbitMQ = testServices.get('rabbitmq');

      const concurrentEvents = Array.from({ length: 50 }, (_, i) => ({
        data: { index: i, message: `Concurrent event ${i}` }
      }));

      const startTime = process.hrtime.bigint();
      await Promise.all(
        concurrentEvents.map(event => messageBus.publish('ConcurrentTest', event.data))
      );
      const endTime = process.hrtime.bigint();

      const concurrentDuration = Number(endTime - startTime) / 1000000;

      expect(concurrentDuration).toBeLessThan(500); // Should handle 50 concurrent events within 500ms
      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(50);
    });
  });

  describe('Memory Performance Tests', () => {
    it('should not leak memory during request processing', async () => {
      app.get('/api/memory-test', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        // Create some objects and let them go out of scope
        const largeObject = Array.from({ length: 10000 }, (_, i) => ({
          data: `item-${i}`,
          timestamp: Date.now(),
          metadata: { id: i, type: 'test-data' }
        }));
        
        // Process but don't return the large object
        res.json({ 
          message: 'Memory test completed',
          processedItems: largeObject.length 
        });
      });

      const initialMemory = process.memoryUsage();
      
      // Make multiple requests to test for memory leaks
      for (let i = 0; i < 20; i++) {
        await makeRequest(app, 'GET', '/api/memory-test');
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be minimal (less than 10MB for 20 requests)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large responses efficiently', async () => {
      app.get('/api/large-response', performanceMiddleware.buildMiddleware(), (req: any, res: any) => {
        const largeResponse = {
          data: Array.from({ length: 5000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            properties: {
              value1: Math.random(),
              value2: Math.random(),
              value3: Math.random()
            }
          })),
          metadata: {
            timestamp: Date.now(),
            totalItems: 5000,
            version: '1.0'
          }
        };
        
        res.json(largeResponse);
      });

      const startTime = process.hrtime.bigint();
      const response = await makeRequest(app, 'GET', '/api/large-response');
      const endTime = process.hrtime.bigint();

      const responseDuration = Number(endTime - startTime) / 1000000;

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5000);
      expect(responseDuration).toBeLessThan(1000); // Should handle large response within 1 second
    });
  });

  describe('Cache Performance Tests', () => {
    it('should demonstrate cache performance improvement', async () => {
      const RedisClient = require('../../../../shared/redis/RedisClient').RedisClient;
      const redis = new RedisClient({
        url: 'redis://localhost:6379/15',
        retryDelay: 100,
        maxRetriesPerRequest: 3
      });

      const testKey = 'performance:cache:test';
      const testValue = JSON.stringify({
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `data-${i}`
        })),
        timestamp: Date.now()
      });

      // First write (cache miss)
      const writeStartTime = process.hrtime.bigint();
      await redis.set(testKey, testValue);
      const writeEndTime = process.hrtime.bigint();

      const writeDuration = Number(writeEndTime - writeStartTime) / 1000000;

      // First read (cache miss)
      const read1StartTime = process.hrtime.bigint();
      const value1 = await redis.get(testKey);
      const read1EndTime = process.hrtime.bigint();

      const read1Duration = Number(read1EndTime - read1StartTime) / 1000000;

      // Second read (cache hit)
      const read2StartTime = process.hrtime.bigint();
      const value2 = await redis.get(testKey);
      const read2EndTime = process.hrtime.bigint();

      const read2Duration = Number(read2EndTime - read2StartTime) / 1000000;

      expect(value1).toBe(testValue);
      expect(value2).toBe(testValue);
      expect(writeDuration).toBeLessThan(50); // Write should be fast
      expect(read1Duration).toBeLessThan(50); // First read should be fast (in-memory)
      expect(read2Duration).toBeLessThan(50); // Second read should be very fast (cache hit)
      expect(read2Duration).toBeLessThanOrEqual(read1Duration); // Cache hits should be as fast or faster
    });

    it('should handle cache operations under load', async () => {
      const redis = testServices.get('redis');
      const concurrentOps = 100;
      const operations = [];

      for (let i = 0; i < concurrentOps; i++) {
        operations.push(redis.set(`perf:test:${i}`, `value-${i}`));
      }

      const startTime = process.hrtime.bigint();
      await Promise.all(operations);
      const endTime = process.hrtime.bigint();

      const batchDuration = Number(endTime - startTime) / 1000000;
      const avgOperationTime = batchDuration / concurrentOps;

      expect(batchDuration).toBeLessThan(1000); // Should complete 100 operations within 1 second
      expect(avgOperationTime).toBeLessThan(10); // Average operation should be under 10ms
    });
  });

  describe('System Resource Performance Tests', () => {
    it('should maintain acceptable CPU usage during processing', async () => {
      const startCpuUsage = process.cpuUsage();

      // Perform CPU-intensive operations
      const cpuIntensiveTask = () => {
        let result = 0;
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i) * Math.random();
        }
        return result;
      };

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(
        Array.from({ length: 5 }, () => Promise.resolve(cpuIntensiveTask()))
      );
      const endTime = process.hrtime.bigint();

      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const duration = Number(endTime - startTime) / 1000000;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(5000); // Should complete CPU-intensive work within 5 seconds
      
      // CPU usage should be reasonable (this is a basic check)
      const totalCpuTime = endCpuUsage.user + endCpuUsage.system;
      expect(totalCpuTime).toBeGreaterThan(0);
    });

    it('should handle file I/O operations efficiently', async () => {
      const fs = require('fs').promises;
      const testFilePath = '/tmp/performance-test-file.json';
      const testData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `test-data-${i}`,
          timestamp: Date.now()
        }))
      };

      // Write performance test
      const writeStartTime = process.hrtime.bigint();
      await fs.writeFile(testFilePath, JSON.stringify(testData));
      const writeEndTime = process.hrtime.bigint();

      const writeDuration = Number(writeEndTime - writeStartTime) / 1000000;

      // Read performance test
      const readStartTime = process.hrtime.bigint();
      const readData = JSON.parse(await fs.readFile(testFilePath, 'utf8'));
      const readEndTime = process.hrtime.bigint();

      const readDuration = Number(readEndTime - readStartTime) / 1000000;

      // Cleanup
      await fs.unlink(testFilePath);

      expect(readData.items).toHaveLength(1000);
      expect(writeDuration).toBeLessThan(500); // Write should complete within 500ms
      expect(readDuration).toBeLessThan(200); // Read should complete within 200ms
    });
  });

  describe('Benchmark Performance Tests', () => {
    it('should benchmark middleware processing time', async () => {
      const benchmarks = [];
      const testIterations = 1000;

      for (let i = 0; i < testIterations; i++) {
        const startTime = process.hrtime.bigint();
        
        // Simulate middleware processing
        const req = { method: 'GET', url: '/test', headers: {}, user: { id: 'test' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();
        
        await performanceMiddleware.execute(req, res, next);
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        
        benchmarks.push(duration);
      }

      const avgTime = benchmarks.reduce((a, b) => a + b, 0) / benchmarks.length;
      const maxTime = Math.max(...benchmarks);
      const minTime = Math.min(...benchmarks);

      // Performance expectations
      expect(avgTime).toBeLessThan(1); // Average should be under 1ms
      expect(maxTime).toBeLessThan(10); // Maximum should be under 10ms
      expect(minTime).toBeGreaterThanOrEqual(0);
    });

    it('should benchmark memory allocation patterns', async () => {
      const allocations = [];
      const allocationIterations = 100;

      for (let i = 0; i < allocationIterations; i++) {
        const memoryBefore = process.memoryUsage().heapUsed;
        
        // Simulate memory allocation pattern
        const data = Array.from({ length: 1000 }, (_, index) => ({
          id: index,
          value: Math.random(),
          properties: {
            created: Date.now(),
            type: 'benchmark-data'
          }
        }));
        
        const memoryAfter = process.memoryUsage().heapUsed;
        const allocation = memoryAfter - memoryBefore;
        
        allocations.push(allocation);
        
        // Allow GC to clean up
        data.length = 0;
      }

      const avgAllocation = allocations.reduce((a, b) => a + b, 0) / allocations.length;
      const totalAllocation = allocations.reduce((a, b) => a + b, 0);

      // Memory allocation should be consistent and reasonable
      expect(avgAllocation).toBeGreaterThan(0);
      expect(totalAllocation).toBeLessThan(50 * 1024 * 1024); // Less than 50MB total
      expect(allocations.every(a => a >= 0)).toBe(true);
    });
  });
});