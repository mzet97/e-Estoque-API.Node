import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GatewayMiddlewareStack } from './core/GatewayMiddlewareStack'
import RedisClient from '@shared/redis/RedisClient'

// Load environment variables
dotenv.config()

interface GatewayEnvironment {
  PORT: number
  HOST: string
  NODE_ENV: string
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD?: string
  REDIS_DATABASE: number
  ALLOWED_ORIGINS: string
  SERVICES_AUTH_URL: string
  SERVICES_COMPANIES_URL: string
  SERVICES_CUSTOMERS_URL: string
  SERVICES_SALES_URL: string
  SERVICES_INVENTORY_URL: string
  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: number
  CIRCUIT_BREAKER_SUCCESS_THRESHOLD: number
  CIRCUIT_BREAKER_TIMEOUT: number
  LOAD_BALANCING_ALGORITHM: string
  MAX_REQUEST_TIMEOUT: number
  ENABLE_METRICS: boolean
  LOG_LEVEL: string
}

class GatewayServer {
  private app: Express
  private port: number
  private host: string
  private gatewayMiddleware: GatewayMiddlewareStack
  private redisClient: RedisClient
  private isShuttingDown = false

  constructor() {
    this.app = express()
    this.port = parseInt(process.env.PORT || '3000', 10)
    this.host = process.env.HOST || 'localhost'
    this.redisClient = RedisClient.getInstance()
    this.gatewayMiddleware = new GatewayMiddlewareStack()

    this.initializeMiddleware()
    this.setupGracefulShutdown()
  }

  private initializeMiddleware(): void {
    console.log('🚀 Initializing e-Estoque API Gateway...')

    // Parse JSON with increased limit for large payloads
    this.app.use(express.json({ 
      limit: '10mb',
      type: 'application/json'
    }))
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }))

    // Configure gateway middleware
    this.configureGateway()

    // Add startup health check
    this.app.get('/startup', (req, res) => {
      res.json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        port: this.port,
        host: this.host
      })
    })
  }

  private configureGateway(): void {
    const environment = this.getEnvironmentConfig()

    const gatewayConfig = {
      port: this.port,
      host: this.host,
      cors: {
        origin: environment.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
        credentials: true
      },
      rateLimit: {
        windowMs: environment.RATE_LIMIT_WINDOW_MS,
        max: environment.RATE_LIMIT_MAX_REQUESTS,
        message: 'Too many requests from this IP, please try again later'
      },
      services: {
        auth: {
          baseUrl: environment.SERVICES_AUTH_URL,
          circuitBreaker: true,
          rateLimit: true,
          loadBalancing: true
        },
        companies: {
          baseUrl: environment.SERVICES_COMPANIES_URL,
          circuitBreaker: true,
          rateLimit: true,
          loadBalancing: true
        },
        customers: {
          baseUrl: environment.SERVICES_CUSTOMERS_URL,
          circuitBreaker: true,
          rateLimit: true,
          loadBalancing: true
        },
        sales: {
          baseUrl: environment.SERVICES_SALES_URL,
          circuitBreaker: true,
          rateLimit: true,
          loadBalancing: true
        },
        inventory: {
          baseUrl: environment.SERVICES_INVENTORY_URL,
          circuitBreaker: true,
          rateLimit: true,
          loadBalancing: true
        }
      }
    }

    this.gatewayMiddleware.configureMiddleware(this.app)

    // Add custom gateway routes
    this.configureCustomRoutes()

    console.log('✅ Gateway middleware configuration completed')
  }

  private configureCustomRoutes(): void {
    // Root endpoint with gateway information
    this.app.get('/', (req, res) => {
      res.json({
        name: 'e-Estoque API Gateway',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: '/health',
          healthDetailed: '/health/detailed',
          admin: {
            services: '/admin/services/status',
            metrics: '/admin/metrics/performance',
            versions: '/admin/metrics/versions',
            circuitBreakers: '/admin/circuit-breakers/status'
          },
          api: {
            customers: '/api/v1/customers',
            sales: '/api/v1/sales',
            inventory: '/api/v1/inventory'
          }
        }
      })
    })

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        openapi: '3.0.0',
        info: {
          title: 'e-Estoque API Gateway',
          version: '1.0.0',
          description: 'Unified API Gateway for e-Estoque microservices'
        },
        servers: [
          {
            url: `http://${this.host}:${this.port}`,
            description: 'Development server'
          }
        ],
        paths: {
          '/health': {
            get: {
              summary: 'Gateway health check',
              responses: {
                '200': {
                  description: 'Gateway is healthy'
                }
              }
            }
          },
          '/api/v1/customers': {
            get: {
              summary: 'List customers',
              responses: {
                '200': {
                  description: 'List of customers'
                }
              }
            },
            post: {
              summary: 'Create customer',
              responses: {
                '201': {
                  description: 'Customer created successfully'
                }
              }
            }
          }
        }
      })
    })
  }

  private getEnvironmentConfig(): GatewayEnvironment {
    return {
      PORT: parseInt(process.env.PORT || '3000', 10),
      HOST: process.env.HOST || 'localhost',
      NODE_ENV: process.env.NODE_ENV || 'development',
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DATABASE: parseInt(process.env.REDIS_DATABASE || '0', 10),
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001',
      SERVICES_AUTH_URL: process.env.SERVICES_AUTH_URL || 'http://localhost:3001',
      SERVICES_COMPANIES_URL: process.env.SERVICES_COMPANIES_URL || 'http://localhost:3002',
      SERVICES_CUSTOMERS_URL: process.env.SERVICES_CUSTOMERS_URL || 'http://localhost:3003',
      SERVICES_SALES_URL: process.env.SERVICES_SALES_URL || 'http://localhost:3004',
      SERVICES_INVENTORY_URL: process.env.SERVICES_INVENTORY_URL || 'http://localhost:3005',
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      CIRCUIT_BREAKER_FAILURE_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
      CIRCUIT_BREAKER_SUCCESS_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '3', 10),
      CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10), // 1 minute
      LOAD_BALANCING_ALGORITHM: process.env.LOAD_BALANCING_ALGORITHM || 'round-robin',
      MAX_REQUEST_TIMEOUT: parseInt(process.env.MAX_REQUEST_TIMEOUT || '30000', 10),
      ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
      
      this.isShuttingDown = true
      
      // Stop accepting new connections
      if (this.server) {
        this.server.close(async (err) => {
          if (err) {
            console.error('Error during server shutdown:', err)
            process.exit(1)
          }
          
          console.log('✅ HTTP server closed')
          
          try {
            await this.redisClient.disconnect()
            console.log('✅ Redis connection closed')
          } catch (error) {
            console.error('Error closing Redis connection:', error)
          }
          
          console.log('✅ Graceful shutdown completed')
          process.exit(0)
        })
      }
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      gracefulShutdown('UNCAUGHT_EXCEPTION')
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown('UNHANDLED_REJECTION')
    })
  }

  private server: any = null

  public async start(): Promise<void> {
    try {
      console.log('🔧 Connecting to Redis...')
      await this.redisClient.connect()
      console.log('✅ Connected to Redis')

      // Start the server
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.port, this.host, async () => {
          console.log(`🚀 e-Estoque API Gateway is running!`)
          console.log(`📍 Address: http://${this.host}:${this.port}`)
          console.log(`🏥 Health Check: http://${this.host}:${this.port}/health`)
          console.log(`📊 Detailed Health: http://${this.host}:${this.port}/health/detailed`)
          console.log(`🔧 Admin Panel: http://${this.host}:${this.port}/admin/services/status`)
          console.log(`📚 API Docs: http://${this.host}:${this.port}/docs`)
          console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
          console.log(`⏰ Started at: ${new Date().toISOString()}`)
          console.log('🎯 Gateway is ready to receive requests!')
          
          resolve()
        })

        this.server.on('error', (error: any) => {
          console.error('Server startup error:', error)
          reject(error)
        })
      })
    } catch (error) {
      console.error('Failed to start Gateway:', error)
      throw error
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 Stopping Gateway server...')
    
    if (this.server) {
      this.server.close()
    }
    
    await this.redisClient.disconnect()
    
    console.log('✅ Gateway server stopped')
  }

  public getApp(): Express {
    return this.app
  }

  public getConfig() {
    return this.gatewayMiddleware.getConfig()
  }

  public async getHealthStatus() {
    try {
      const redisHealth = await this.redisClient.health()
      
      return {
        status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        redis: redisHealth,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: error.message,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    }
  }
}

// Create and export gateway instance
export default GatewayServer

// Export server creation function
export function createGatewayServer(): GatewayServer {
  return new GatewayServer()
}

// If this file is run directly, start the server
if (require.main === module) {
  const server = createGatewayServer()
  
  server.start().catch((error) => {
    console.error('Failed to start gateway server:', error)
    process.exit(1)
  })
}