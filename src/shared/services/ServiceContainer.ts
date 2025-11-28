import RabbitMQService from '../shared/services/RabbitMQService'
import MessageBus from '../shared/services/MessageBus'
import CacheService, { createCacheConfig } from '../shared/services/CacheService'
import SessionService from '../shared/services/SessionService'
import EmailService from '../shared/services/EmailService'
import FileStorageService from '../shared/services/FileStorageService'
import PDFGenerationService from '../shared/services/PDFGenerationService'
import RedisClient from '../shared/redis/RedisClient'

export interface ServiceConfiguration {
  redis: {
    host: string
    port: number
    password?: string
    database: number
  }
  rabbitMQ: {
    host: string
    port: number
    username: string
    password: string
    vhost?: string
  }
  email: {
    provider: 'sendgrid' | 'ses' | 'smtp' | 'mock'
    from: string
    fromName?: string
    sendgrid?: { apiKey: string }
    ses?: { accessKeyId: string; secretAccessKey: string; region: string }
    smtp?: { host: string; port: number; secure: boolean; auth: { user: string; pass: string } }
  }
  fileStorage: {
    provider: 'local' | 's3' | 'gcs' | 'mock'
    local?: { basePath: string; publicUrl?: string }
    s3?: { bucket: string; region: string; accessKeyId: string; secretAccessKey: string; publicUrl?: string }
    gcs?: { bucket: string; projectId: string; keyFilename: string; publicUrl?: string }
  }
  pdfGeneration: {
    outputDirectory: string
    baseUrl?: string
    companyInfo: {
      name: string
      document: string
      address: string
      phone: string
      email: string
      logo?: string
    }
  }
  cache: {
    defaultTTL: number
    contextConfigs: any
  }
  session: {
    ttl: number
    maxSessionsPerUser: number
    cleanupInterval: number
  }
}

export class ServiceContainer {
  private static instance: ServiceContainer
  private services: Map<string, any> = new Map()
  private config: ServiceConfiguration

  private constructor(config: ServiceConfiguration) {
    this.config = config
  }

  static getInstance(config: ServiceConfiguration): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(config)
    }
    return ServiceContainer.instance
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Service Container...')

    try {
      // Initialize Redis first
      const redis = await this.initializeRedis()
      
      // Initialize RabbitMQ
      await this.initializeRabbitMQ(redis)
      
      // Initialize Cache Service
      await this.initializeCacheService(redis)
      
      // Initialize Session Service
      await this.initializeSessionService(redis)
      
      // Initialize Message Bus
      await this.initializeMessageBus(redis)
      
      // Initialize Email Service
      await this.initializeEmailService(redis)
      
      // Initialize File Storage Service
      await this.initializeFileStorageService()
      
      // Initialize PDF Generation Service
      await this.initializePDFGenerationService()

      console.log('✅ All services initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize services:', error)
      throw error
    }
  }

  private async initializeRedis(): Promise<RedisClient> {
    const redis = RedisClient.getInstance({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      database: this.config.redis.database
    })

    await redis.connect()
    this.services.set('redis', redis)
    
    console.log('✅ Redis initialized')
    return redis
  }

  private async initializeRabbitMQ(redis: RedisClient): Promise<void> {
    const rabbitMQ = new RabbitMQService(this.config.rabbitMQ)
    await rabbitMQ.connect()
    this.services.set('rabbitMQ', rabbitMQ)
    
    console.log('✅ RabbitMQ initialized')
  }

  private async initializeCacheService(redis: RedisClient): Promise<void> {
    const cacheConfig = createCacheConfig()
    const cacheService = new CacheService(redis, cacheConfig)
    this.services.set('cache', cacheService)
    
    console.log('✅ Cache Service initialized')
  }

  private async initializeSessionService(redis: RedisClient): Promise<void> {
    const sessionService = new SessionService(redis, {
      ttl: this.config.session.ttl,
      maxSessionsPerUser: this.config.session.maxSessionsPerUser,
      cleanupInterval: this.config.session.cleanupInterval,
      sessionPrefix: 'session:'
    })
    this.services.set('session', sessionService)
    
    console.log('✅ Session Service initialized')
  }

  private async initializeMessageBus(redis: RedisClient): Promise<void> {
    const rabbitMQ = this.services.get('rabbitMQ') as RabbitMQService
    
    const messageBusConfig = {
      rabbitMQ: this.config.rabbitMQ,
      exchanges: {
        'domain.events': { type: 'topic', durable: true },
        'events.dlx': { type: 'direct', durable: true }
      },
      queues: {
        'events.customer_created': { durable: true, deadLetterExchange: 'events.dlx' },
        'events.sale_created': { durable: true, deadLetterExchange: 'events.dlx' },
        'events.stock_movement': { durable: true, deadLetterExchange: 'events.dlx' },
        'events.dlq': { durable: true }
      },
      routingKeys: {
        'CustomerCreated': 'events.customer.created',
        'CustomerUpdated': 'events.customer.updated',
        'CustomerDeleted': 'events.customer.deleted',
        'SaleCreated': 'events.sale.created',
        'SaleConfirmed': 'events.sale.confirmed',
        'SaleCancelled': 'events.sale.cancelled',
        'StockMovement': 'events.inventory.movement',
        'LowStockAlert': 'events.inventory.low_stock',
        'CompanyCreated': 'events.company.created',
        'CompanyUpdated': 'events.company.updated',
        'UserRegistered': 'events.user.registered',
        'UserActivated': 'events.user.activated',
        'EmailSent': 'events.email.sent'
      }
    }

    const messageBus = new MessageBus(messageBusConfig, undefined, rabbitMQ, redis)
    await messageBus.initialize()
    this.services.set('messageBus', messageBus)
    
    console.log('✅ Message Bus initialized')
  }

  private async initializeEmailService(redis: RedisClient): Promise<void> {
    const emailService = new EmailService(redis, this.config.email)
    this.services.set('email', emailService)
    
    console.log('✅ Email Service initialized')
  }

  private async initializeFileStorageService(): Promise<void> {
    const fileStorageService = new FileStorageService(this.config.fileStorage)
    this.services.set('fileStorage', fileStorageService)
    
    console.log('✅ File Storage Service initialized')
  }

  private async initializePDFGenerationService(): Promise<void> {
    const pdfService = new PDFGenerationService(this.config.pdfGeneration)
    this.services.set('pdf', pdfService)
    
    console.log('✅ PDF Generation Service initialized')
  }

  // Service getters
  getRedis(): RedisClient {
    return this.services.get('redis')
  }

  getRabbitMQ(): RabbitMQService {
    return this.services.get('rabbitMQ')
  }

  getCache(): CacheService {
    return this.services.get('cache')
  }

  getSession(): SessionService {
    return this.services.get('session')
  }

  getMessageBus(): MessageBus {
    return this.services.get('messageBus')
  }

  getEmail(): EmailService {
    return this.services.get('email')
  }

  getFileStorage(): FileStorageService {
    return this.services.get('fileStorage')
  }

  getPDF(): PDFGenerationService {
    return this.services.get('pdf')
  }

  // Health checks
  async getHealthStatus(): Promise<any> {
    const health: any = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {}
    }

    for (const [name, service] of this.services) {
      try {
        if (service.isHealthy) {
          health.services[name] = {
            status: await service.isHealthy() ? 'healthy' : 'unhealthy'
          }
        } else {
          health.services[name] = { status: 'unknown' }
        }
      } catch (error) {
        health.services[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        health.overall = 'degraded'
      }
    }

    return health
  }

  // Shutdown
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Service Container...')

    const shutdownPromises = []

    for (const [name, service] of this.services) {
      if (service.shutdown) {
        shutdownPromises.push(service.shutdown())
        console.log(`🔌 Shutting down ${name}...`)
      }
    }

    try {
      await Promise.all(shutdownPromises)
      console.log('✅ All services shut down successfully')
    } catch (error) {
      console.error('❌ Error during service shutdown:', error)
    }
  }
}

// Example usage configuration
export const createServiceConfig = (): ServiceConfiguration => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || '0')
  },
  rabbitMQ: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER as any) || 'mock',
    from: process.env.EMAIL_FROM || 'noreply@eestoque.local',
    fromName: process.env.EMAIL_FROM_NAME || 'e-Estoque',
    sendgrid: process.env.SENDGRID_API_KEY ? {
      apiKey: process.env.SENDGRID_API_KEY
    } : undefined,
    ses: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION || 'us-east-1'
    } : undefined,
    smtp: process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    } : undefined
  },
  fileStorage: {
    provider: (process.env.FILE_STORAGE_PROVIDER as any) || 'mock',
    local: {
      basePath: process.env.LOCAL_STORAGE_PATH || './uploads',
      publicUrl: process.env.LOCAL_STORAGE_URL || 'http://localhost:3000/files'
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicUrl: process.env.S3_PUBLIC_URL
    },
    gcs: {
      bucket: process.env.GCS_BUCKET,
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILENAME,
      publicUrl: process.env.GCS_PUBLIC_URL
    }
  },
  pdfGeneration: {
    outputDirectory: process.env.PDF_OUTPUT_PATH || './pdfs',
    baseUrl: process.env.PDF_BASE_URL || 'http://localhost:3000/pdfs',
    companyInfo: {
      name: process.env.COMPANY_NAME || 'e-Estoque',
      document: process.env.COMPANY_DOCUMENT || '00.000.000/0001-00',
      address: process.env.COMPANY_ADDRESS || 'Rua Exemplo, 123',
      phone: process.env.COMPANY_PHONE || '(11) 1234-5678',
      email: process.env.COMPANY_EMAIL || 'contato@eestoque.local',
      logo: process.env.COMPANY_LOGO
    }
  },
  cache: {
    defaultTTL: 3600,
    contextConfigs: {}
  },
  session: {
    ttl: 24 * 60 * 60, // 24 hours
    maxSessionsPerUser: 5,
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  }
})

export default ServiceContainer