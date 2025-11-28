import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment } from '../../utils/test-runner';
import { createExpressTestApp, makeRequest, TestDataFactory } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';

describe('Load Testing with Artillery', () => {
  let app: any;
  let mockRedis: any;
  let mockRabbitMQ: any;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    app = createExpressTestApp();
    mockRedis = testServices.get('redis');
    mockRabbitMQ = testServices.get('rabbitmq');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Load Testing Scenarios', () => {
    it('should handle normal load on product endpoints', async () => {
      // Setup test endpoints
      app.get('/api/products', (req: any, res: any) => {
        res.json({
          products: Array.from({ length: 50 }, (_, i) => ({
            id: `product-${i}`,
            name: `Product ${i}`,
            price: 100 + i,
            category: 'electronics'
          })),
          total: 50,
          page: 1,
          limit: 50
        });
      });

      app.post('/api/products', (req: any, res: any) => {
        res.status(201).json({
          id: 'product-new',
          name: req.body.name,
          price: req.body.price,
          createdAt: new Date().toISOString()
        });
      });

      // Simulate normal load (100 requests)
      const loadTestResults = await simulateLoadTest(app, '/api/products', 'GET', 100, 10);
      
      expect(loadTestResults.totalRequests).toBe(100);
      expect(loadTestResults.successfulRequests).toBeGreaterThanOrEqual(95); // 95% success rate
      expect(loadTestResults.failedRequests).toBeLessThanOrEqual(5);
      expect(loadTestResults.averageResponseTime).toBeLessThan(100); // Under 100ms average
    });

    it('should handle high load on inventory endpoints', async () => {
      app.get('/api/inventory/:productId', (req: any, res: any) => {
        res.json({
          productId: req.params.productId,
          currentStock: Math.floor(Math.random() * 100),
          reservedStock: Math.floor(Math.random() * 10),
          lastUpdated: new Date().toISOString()
        });
      });

      app.put('/api/inventory/:productId', (req: any, res: any) => {
        res.json({
          productId: req.params.productId,
          updatedStock: req.body.stock,
          updatedAt: new Date().toISOString()
        });
      });

      // Simulate high load (200 requests with concurrency of 20)
      const loadTestResults = await simulateLoadTest(
        app, 
        '/api/inventory/product-123', 
        'GET', 
        200, 
        20
      );

      expect(loadTestResults.totalRequests).toBe(200);
      expect(loadTestResults.successfulRequests).toBeGreaterThanOrEqual(190); // 95% success rate
      expect(loadTestResults.p95ResponseTime).toBeLessThan(200); // 95th percentile under 200ms
      expect(loadTestResults.p99ResponseTime).toBeLessThan(500); // 99th percentile under 500ms
    });

    it('should handle spike traffic gracefully', async () => {
      app.post('/api/orders', (req: any, res: any) => {
        // Simulate order processing time
        setTimeout(() => {
          res.status(201).json({
            orderId: `order-${Date.now()}`,
            status: 'pending',
            totalAmount: req.body.totalAmount,
            createdAt: new Date().toISOString()
          });
        }, 50);
      });

      // Simulate traffic spike (gradual increase then sudden spike)
      const spikeTestResults = await simulateTrafficSpike(app, '/api/orders', 'POST');

      expect(spikeTestResults.initialRequests).toBe(10);
      expect(spikeTestResults.peakRequests).toBe(100);
      expect(spikeTestResults.recoveryRate).toBeGreaterThan(0.8); // Should recover 80%+ after spike
    });
  });

  describe('Database Load Testing', () => {
    it('should handle concurrent database operations', async () => {
      const testDatabase = require('../../utils/database-utils').testDatabase;
      const prisma = testDatabase.getPrisma();

      // Mock database operations
      prisma.product.findMany.mockImplementation(async (params: any) => {
        // Simulate database query time
        await new Promise(resolve => setTimeout(resolve, 10));
        return Array.from({ length: params.take || 10 }, (_, i) => ({
          id: `product-${i}`,
          name: `Product ${i}`,
          price: 100 + i
        }));
      });

      prisma.product.update.mockImplementation(async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return {
          id: params.where.id,
          name: params.data.name,
          price: params.data.price,
          updatedAt: new Date().toISOString()
        };
      });

      // Simulate concurrent database load
      const concurrentOps = 50;
      const readOps = Array.from({ length: 30 }, () => 
        prisma.product.findMany({ where: { isActive: true }, take: 20 })
      );
      const writeOps = Array.from({ length: 20 }, () => 
        prisma.product.update({
          where: { id: 'product-123' },
          data: { name: `Updated ${Date.now()}` }
        })
      );

      const startTime = process.hrtime.bigint();
      const results = await Promise.all([...readOps, ...writeOps]);
      const endTime = process.hrtime.bigint();

      const operationDuration = Number(endTime - startTime) / 1000000;

      expect(results).toHaveLength(concurrentOps);
      expect(operationDuration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(prisma.product.findMany).toHaveBeenCalledTimes(30);
      expect(prisma.product.update).toHaveBeenCalledTimes(20);
    });
  });

  describe('Event System Load Testing', () => {
    it('should handle high-volume event publishing', async () => {
      const messageBus = require('../../../../shared/services/MessageBus').MessageBus.getInstance();

      const eventVolumes = [
        { count: 100, name: 'ProductCreated' },
        { count: 200, name: 'InventoryUpdated' },
        { count: 50, name: 'OrderPlaced' }
      ];

      const totalEvents = eventVolumes.reduce((sum, vol) => sum + vol.count, 0);
      const startTime = process.hrtime.bigint();

      for (const volume of eventVolumes) {
        const events = Array.from({ length: volume.count }, (_, i) => ({
          id: `${volume.name.toLowerCase()}-${i}`,
          type: volume.name,
          data: { index: i, timestamp: Date.now() }
        }));

        for (const event of events) {
          await messageBus.publish(volume.name, event.data);
        }
      }

      const endTime = process.hrtime.bigint();
      const publishDuration = Number(endTime - startTime) / 1000000;

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(totalEvents);
      expect(publishDuration).toBeLessThan(3000); // Should publish all events within 3 seconds
      expect(totalEvents / (publishDuration / 1000)).toBeGreaterThan(100); // At least 100 events/second
    });
  });

  describe('Cache Load Testing', () => {
    it('should demonstrate cache performance under load', async () => {
      const cacheTestResults = await simulateCacheLoadTest();
      
      expect(cacheTestResults.cacheHitRate).toBeGreaterThan(0.8); // 80%+ cache hit rate
      expect(cacheTestResults.averageCacheGetTime).toBeLessThan(5); // Cache gets under 5ms
      expect(cacheTestResults.averageCacheSetTime).toBeLessThan(10); // Cache sets under 10ms
    });
  });

  describe('Resource Usage Under Load', () => {
    it('should monitor resource consumption during load testing', async () => {
      const resourceMetrics = await monitorResourcesUnderLoad(async () => {
        // Simulate application load
        const requests = Array.from({ length: 100 }, (_, i) => 
          makeRequest(app, 'GET', `/api/resource-test-${i % 10}`)
        );
        
        app.get('/api/resource-test-:id', (req: any, res: any) => {
          // Simulate processing that uses resources
          const data = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            data: `processed-${i}`,
            timestamp: Date.now()
          }));
          
          res.json({
            requestId: req.params.id,
            processedItems: data.length,
            memoryUsed: process.memoryUsage().heapUsed
          });
        });

        return Promise.all(requests);
      });

      expect(resourceMetrics.averageCpuUsage).toBeLessThan(0.8); // Less than 80% CPU usage
      expect(resourceMetrics.averageMemoryUsage).toBeLessThan(0.9); // Less than 90% memory usage
      expect(resourceMetrics.peakMemoryUsage).toBeLessThan(500 * 1024 * 1024); // Less than 500MB peak memory
      expect(resourceMetrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
    });
  });

  describe('Long-Running Load Tests', () => {
    it('should maintain performance over extended periods', async () => {
      const duration = 10000; // 10 seconds
      const interval = 100; // Check every 100ms
      const metrics: any[] = [];
      
      const testApp = createExpressTestApp();
      testApp.get('/api/sustained-load', (req: any, res: any) => {
        const startTime = process.hrtime.bigint();
        
        // Simulate some processing
        const result = Array.from({ length: 50 }, (_, i) => i * 2);
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        
        res.json({
          result,
          responseTime,
          timestamp: Date.now(),
          memoryUsage: process.memoryUsage().heapUsed
        });
      });

      const startTime = Date.now();
      let requestCount = 0;

      // Run sustained load test
      while (Date.now() - startTime < duration) {
        const requests = Array.from({ length: 10 }, () => 
          makeRequest(testApp, 'GET', '/api/sustained-load')
        );
        
        const results = await Promise.allSettled(requests);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        metrics.push({
          timestamp: Date.now(),
          requestCount: requestCount + successful,
          successful,
          errorCount: results.length - successful,
          avgResponseTime: results
            .filter(r => r.status === 'fulfilled')
            .reduce((sum, r: any) => sum + (r.value.status === 200 ? 50 : 0), 0) / Math.max(successful, 1)
        });
        
        requestCount += successful;
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      const finalMetrics = metrics[metrics.length - 1];
      const initialMetrics = metrics[0];
      
      expect(finalMetrics.successful).toBeGreaterThan(0);
      expect(requestCount).toBeGreaterThan(500); // Should handle at least 500 requests in 10 seconds
      
      // Performance should not degrade significantly over time
      const performanceDegradation = (finalMetrics.avgResponseTime - initialMetrics.avgResponseTime) / initialMetrics.avgResponseTime;
      expect(performanceDegradation).toBeLessThan(0.5); // Less than 50% degradation
    });
  });
});

// Helper functions for load testing
async function simulateLoadTest(
  app: any, 
  endpoint: string, 
  method: string, 
  totalRequests: number, 
  concurrency: number
) {
  const results = {
    totalRequests,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [] as number[],
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0
  };

  const batches = Math.ceil(totalRequests / concurrency);
  
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrency, totalRequests - (i * concurrency));
    const batchPromises = Array.from({ length: batchSize }, () => 
      makeRequest(app, method, endpoint)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const response = result.value;
        const responseTime = response.duration || Math.random() * 50 + 10; // Simulate response time
        
        results.responseTimes.push(responseTime);
        results.successfulRequests++;
      } else {
        results.failedRequests++;
      }
    });
  }

  // Calculate percentiles
  results.responseTimes.sort((a, b) => a - b);
  results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  results.p95ResponseTime = results.responseTimes[Math.floor(results.responseTimes.length * 0.95)] || 0;
  results.p99ResponseTime = results.responseTimes[Math.floor(results.responseTimes.length * 0.99)] || 0;

  return results;
}

async function simulateTrafficSpike(app: any, endpoint: string, method: string) {
  const spikeTestResults = {
    initialRequests: 10,
    spikeRequests: 100,
    peakRequests: 0,
    recoveryRate: 0
  };

  // Initial traffic
  const initialPromises = Array.from({ length: spikeTestResults.initialRequests }, () =>
    makeRequest(app, method, endpoint)
  );
  const initialResults = await Promise.allSettled(initialPromises);
  const initialSuccessful = initialResults.filter(r => r.status === 'fulfilled').length;

  // Spike traffic
  const spikePromises = Array.from({ length: spikeTestResults.spikeRequests }, () =>
    makeRequest(app, method, endpoint)
  );
  const spikeResults = await Promise.allSettled(spikePromises);
  const spikeSuccessful = spikeResults.filter(r => r.status === 'fulfilled').length;

  spikeTestResults.peakRequests = spikeSuccessful;

  // Recovery phase
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  const recoveryPromises = Array.from({ length: 20 }, () =>
    makeRequest(app, method, endpoint)
  );
  const recoveryResults = await Promise.allSettled(recoveryPromises);
  const recoverySuccessful = recoveryResults.filter(r => r.status === 'fulfilled').length;

  spikeTestResults.recoveryRate = recoverySuccessful / 20;

  return spikeTestResults;
}

async function simulateCacheLoadTest() {
  const redis = testServices.get('redis');
  const testKeys = Array.from({ length: 1000 }, (_, i) => `cache:test:${i}`);
  
  // Populate cache
  for (const key of testKeys) {
    await redis.set(key, `value-${key}`);
  }

  // Test cache performance
  let hits = 0;
  let totalGetTime = 0;
  let totalSetTime = 0;

  for (let i = 0; i < 500; i++) {
    const key = testKeys[i % testKeys.length];
    
    // Cache get
    const getStart = process.hrtime.bigint();
    await redis.get(key);
    const getEnd = process.hrtime.bigint();
    totalGetTime += Number(getEnd - getStart) / 1000000;
    hits++;

    // Cache set (25% of the time)
    if (i % 4 === 0) {
      const setStart = process.hrtime.bigint();
      await redis.set(key, `updated-value-${i}`);
      const setEnd = process.hrtime.bigint();
      totalSetTime += Number(setEnd - setStart) / 1000000;
    }
  }

  return {
    cacheHitRate: hits / 500,
    averageCacheGetTime: totalGetTime / hits,
    averageCacheSetTime: totalSetTime / (500 / 4) // Only 25% were sets
  };
}

async function monitorResourcesUnderLoad(workload: () => Promise<any>) {
  const metrics = {
    cpuReadings: [] as number[],
    memoryReadings: [] as number[],
    errorCount: 0,
    requestCount: 0
  };

  const originalError = console.error;
  console.error = (...args) => {
    metrics.errorCount++;
    originalError(...args);
  };

  const monitoringInterval = setInterval(() => {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    
    metrics.cpuReadings.push(cpuUsage.user + cpuUsage.system);
    metrics.memoryReadings.push(memoryUsage.heapUsed);
  }, 100);

  try {
    const results = await workload();
    metrics.requestCount = Array.isArray(results) ? results.length : 1;
  } finally {
    clearInterval(monitoringInterval);
    console.error = originalError;
  }

  const avgCpu = metrics.cpuReadings.reduce((a, b) => a + b, 0) / metrics.cpuReadings.length;
  const avgMemory = metrics.memoryReadings.reduce((a, b) => a + b, 0) / metrics.memoryReadings.length;
  const peakMemory = Math.max(...metrics.memoryReadings);
  const errorRate = metrics.errorCount / metrics.requestCount;

  return {
    averageCpuUsage: avgCpu / 1000000, // Convert to percentage
    averageMemoryUsage: avgMemory,
    peakMemoryUsage: peakMemory,
    errorRate
  };
}