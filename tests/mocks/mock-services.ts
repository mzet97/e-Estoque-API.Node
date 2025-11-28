import { RedisClient } from '../../src/shared/redis/RedisClient';
import { RabbitMQService } from '../../src/shared/services/RabbitMQService';
import { MetricsService } from '../../src/shared/services/MetricsService';
import { LoggerService } from '../../src/shared/services/LoggerService';
import { EmailService } from '../../src/shared/services/EmailService';
import { FileStorageService } from '../../src/shared/services/FileStorageService';
import { HealthCheckService } from '../../src/shared/services/HealthCheckService';

// Mock Redis Client
export class MockRedisClient extends RedisClient {
  constructor() {
    super({
      url: 'redis://localhost:6379/15',
      retryDelay: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async connect(): Promise<void> {
    // Mock successful connection
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Mock successful disconnection
    return Promise.resolve();
  }

  async get(key: string): Promise<string | null> {
    // Mock GET operation
    return Promise.resolve(`mock-value-for-${key}`);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    // Mock SET operation
    return Promise.resolve();
  }

  async del(key: string): Promise<void> {
    // Mock DELETE operation
    return Promise.resolve();
  }

  async exists(key: string): Promise<boolean> {
    // Mock EXISTS operation
    return Promise.resolve(true);
  }

  async incr(key: string): Promise<number> {
    // Mock INCR operation
    return Promise.resolve(1);
  }

  async decr(key: string): Promise<number> {
    // Mock DECR operation
    return Promise.resolve(0);
  }
}

// Mock RabbitMQ Service
export class MockRabbitMQService extends RabbitMQService {
  constructor() {
    super({
      url: 'amqp://localhost:5672',
      options: {
        heartbeat: 30,
        reconnectTimeInSeconds: 30,
      },
    });
  }

  async connect(): Promise<void> {
    // Mock successful connection
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Mock successful disconnection
    return Promise.resolve();
  }

  async publish(queue: string, message: any, options?: any): Promise<void> {
    // Mock publish operation
    console.log(`Mock publish to queue ${queue}:`, message);
    return Promise.resolve();
  }

  async consume(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    // Mock consume operation - simulate receiving a message
    setTimeout(() => {
      handler({
        content: Buffer.from(JSON.stringify({ test: 'message' })),
        properties: { correlationId: 'test-correlation-id' },
      });
    }, 10);
    return Promise.resolve();
  }
}

// Mock Metrics Service
export class MockMetricsService extends MetricsService {
  constructor() {
    super({
      serviceName: 'e-estoque-test',
      environment: 'test',
    });
  }

  async startMetricsServer(port: number): Promise<void> {
    // Mock metrics server start
    return Promise.resolve();
  }

  incrementCounter(name: string, labels?: Record<string, string | number>): void {
    // Mock counter increment
    console.log(`Mock counter increment: ${name}`, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string | number>): void {
    // Mock histogram record
    console.log(`Mock histogram record: ${name} = ${value}`, labels);
  }

  recordTimer(name: string, startTime: number, labels?: Record<string, string | number>): void {
    // Mock timer record
    console.log(`Mock timer record: ${name}`, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string | number>): void {
    // Mock gauge record
    console.log(`Mock gauge record: ${name} = ${value}`, labels);
  }
}

// Mock Logger Service
export class MockLoggerService extends LoggerService {
  constructor() {
    super({
      serviceName: 'e-estoque-test',
      environment: 'test',
      level: 'error',
    });
  }

  async initialize(): Promise<void> {
    // Mock logger initialization
    return Promise.resolve();
  }

  info(message: string, metadata?: any, correlationId?: string): void {
    // Mock info log
    console.log(`[INFO] ${message}`, metadata);
  }

  error(message: string, error?: Error | any, metadata?: any, correlationId?: string): void {
    // Mock error log
    console.error(`[ERROR] ${message}`, error, metadata);
  }

  warn(message: string, metadata?: any, correlationId?: string): void {
    // Mock warning log
    console.warn(`[WARN] ${message}`, metadata);
  }

  debug(message: string, metadata?: any, correlationId?: string): void {
    // Mock debug log
    console.debug(`[DEBUG] ${message}`, metadata);
  }
}

// Mock Email Service
export class MockEmailService extends EmailService {
  constructor() {
    super({
      provider: 'mock',
      sendgridApiKey: 'test-sendgrid-key',
      fromEmail: 'test@estoque.com',
    });
  }

  async initialize(): Promise<void> {
    // Mock email service initialization
    return Promise.resolve();
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: {
      from?: string;
      templateId?: string;
      attachments?: any[];
      metadata?: Record<string, string>;
    }
  ): Promise<{ messageId: string }> {
    // Mock email sending
    console.log(`Mock email sent to ${to}: ${subject}`);
    return Promise.resolve({ messageId: `mock-message-id-${Date.now()}` });
  }

  async validateEmail(email: string): Promise<boolean> {
    // Mock email validation
    return Promise.resolve(email.includes('@'));
  }
}

// Mock File Storage Service
export class MockFileStorageService extends FileStorageService {
  constructor() {
    super({
      provider: 'mock',
      bucket: 'test-bucket',
    });
  }

  async initialize(): Promise<void> {
    // Mock file storage initialization
    return Promise.resolve();
  }

  async uploadFile(
    filePath: string,
    content: Buffer,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      acl?: 'public' | 'private';
    }
  ): Promise<{ url: string; key: string }> {
    // Mock file upload
    return Promise.resolve({
      url: `https://test-bucket.s3.amazonaws.com/mock/${filePath}`,
      key: `mock/${filePath}`,
    });
  }

  async downloadFile(key: string): Promise<Buffer> {
    // Mock file download
    return Promise.resolve(Buffer.from('mock file content'));
  }

  async deleteFile(key: string): Promise<void> {
    // Mock file deletion
    return Promise.resolve();
  }

  generateSignedUrl(key: string, expiresIn?: number): string {
    // Mock signed URL generation
    return `https://test-bucket.s3.amazonaws.com/mock-signed/${key}?expires=${Date.now()}`;
  }
}

// Mock Health Check Service
export class MockHealthCheckService extends HealthCheckService {
  constructor() {
    super({
      serviceName: 'e-estoque-test',
      environment: 'test',
    });
  }

  async initialize(): Promise<void> {
    // Mock health check service initialization
    return Promise.resolve();
  }

  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: Record<string, any>;
    timestamp: string;
  }> {
    // Mock health check - always return healthy for tests
    return Promise.resolve({
      status: 'healthy',
      checks: {
        database: { status: 'up' },
        redis: { status: 'up' },
        rabbitmq: { status: 'up' },
      },
      timestamp: new Date().toISOString(),
    });
  }

  async addCustomCheck(name: string, checkFn: () => Promise<any>): Promise<void> {
    // Mock adding custom health check
    // Do nothing in mock implementation
  }
}

// Test Service Container
export class TestServiceContainer {
  private services: Map<string, any> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize all mock services
    this.services.set('redis', new MockRedisClient());
    this.services.set('rabbitmq', new MockRabbitMQService());
    this.services.set('metrics', new MockMetricsService());
    this.services.set('logger', new MockLoggerService());
    this.services.set('email', new MockEmailService());
    this.services.set('fileStorage', new MockFileStorageService());
    this.services.set('healthCheck', new MockHealthCheckService());
  }

  get<T>(serviceName: string): T {
    return this.services.get(serviceName);
  }

  set(serviceName: string, service: any): void {
    this.services.set(serviceName, service);
  }

  async initializeAll(): Promise<void> {
    // Initialize all services
    const initPromises = Array.from(this.services.values()).map(async (service) => {
      if (service.initialize) {
        await service.initialize();
      }
    });
    await Promise.all(initPromises);
  }

  async cleanup(): Promise<void> {
    // Cleanup all services
    const cleanupPromises = Array.from(this.services.values()).map(async (service) => {
      if (service.disconnect) {
        await service.disconnect();
      }
    });
    await Promise.all(cleanupPromises);
  }
}

// Global test service container
export const testServices = new TestServiceContainer();