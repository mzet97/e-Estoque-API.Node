import { Request, Response, NextFunction } from 'express'
import { getDataSource } from '@shared/typeorm'
import { createClient } from 'redis'
import amqplib from 'amqplib'
import { LoggedRequest } from '@shared/log/logger.middleware'

// Interface para health check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
    redis?: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
    rabbitmq?: {
      status: 'up' | 'down'
      responseTime: number
      error?: string
    }
  }
  version: string
  environment: string
}

// Health check do banco de dados
async function checkDatabase(): Promise<{ status: 'up' | 'down', responseTime: number, error?: string }> {
  const startTime = Date.now()
  
  try {
    const dataSource = await getDataSource()
    await dataSource.query('SELECT 1')
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Health check do Redis
async function checkRedis(): Promise<{ status: 'up' | 'down', responseTime: number, error?: string }> {
  const startTime = Date.now()
  
  try {
    const redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      password: process.env.REDIS_PASSWORD || undefined
    })
    
    await redisClient.connect()
    await redisClient.ping()
    await redisClient.quit()
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown Redis error'
    }
  }
}

// Health check do RabbitMQ
async function checkRabbitMQ(): Promise<{ status: 'up' | 'down', responseTime: number, error?: string }> {
  const startTime = Date.now()
  
  try {
    const connection = await amqplib.connect({
      hostname: process.env.RABBITMQ_HOST || 'localhost',
      port: parseInt(process.env.RABBITMQ_PORT || '5672'),
      username: process.env.RABBITMQ_USERNAME || 'estoque_user',
      password: process.env.RABBITMQ_PASSWORD || 'estoque_password_123'
    })
    
    const channel = await connection.createChannel()
    await channel.ping()
    
    await channel.close()
    await connection.close()
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown RabbitMQ error'
    }
  }
}

// Health check geral (simple)
export function basicHealthCheck(req: LoggedRequest, res: Response): void {
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'up',
        responseTime: 0
      }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  res.status(200).json({
    success: true,
    data: healthCheck,
    message: 'Service is healthy'
  })
}

// Health check completo (detailed)
export async function detailedHealthCheck(req: LoggedRequest, res: Response): Promise<void> {
  const startTime = Date.now()
  
  try {
    // Executar todos os health checks em paralelo
    const [databaseCheck, redisCheck, rabbitmqCheck] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkRabbitMQ()
    ])

    const checks: HealthCheck['checks'] = {
      database: databaseCheck.status === 'fulfilled' 
        ? databaseCheck.value 
        : { status: 'down', responseTime: 0, error: 'Check failed' }
    }

    // Adicionar Redis apenas se estiver configurado
    if (process.env.REDIS_HOST) {
      checks.redis = redisCheck.status === 'fulfilled' 
        ? redisCheck.value 
        : { status: 'down', responseTime: 0, error: 'Check failed' }
    }

    // Adicionar RabbitMQ apenas se estiver configurado
    if (process.env.RABBITMQ_HOST) {
      checks.rabbitmq = rabbitmqCheck.status === 'fulfilled' 
        ? rabbitmqCheck.value 
        : { status: 'down', responseTime: 0, error: 'Check failed' }
    }

    // Determinar status geral
    const allChecks = Object.values(checks)
    const hasDownCheck = allChecks.some(check => check.status === 'down')
    const hasSlowCheck = allChecks.some(check => check.responseTime > 5000)

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (hasDownCheck) {
      status = 'unhealthy'
    } else if (hasSlowCheck) {
      status = 'degraded'
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    const httpStatus = status === 'unhealthy' ? 503 : 200

    req.log.info({ 
      status, 
      responseTime: Date.now() - startTime,
      checks: Object.keys(checks).length
    }, 'Health check completed')

    res.status(httpStatus).json({
      success: status !== 'unhealthy',
      data: healthCheck,
      message: status === 'healthy' 
        ? 'Service is healthy' 
        : status === 'degraded' 
          ? 'Service is degraded but functional'
          : 'Service is unhealthy'
    })

  } catch (error) {
    req.log.error({ error }, 'Health check failed')
    
    res.status(503).json({
      success: false,
      data: null,
      message: 'Health check failed',
      errors: [{
        code: 'HEALTH_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    })
  }
}

// Health check específico para readiness
export function readinessCheck(req: LoggedRequest, res: Response): void {
  // Verifica se a aplicação está pronta para receber tráfego
  getDataSource()
    .then(dataSource => {
      if (dataSource.isInitialized) {
        res.status(200).json({
          success: true,
          data: {
            status: 'ready',
            timestamp: new Date().toISOString()
          },
          message: 'Service is ready'
        })
      } else {
        res.status(503).json({
          success: false,
          data: null,
          message: 'Service is not ready',
          errors: [{
            code: 'NOT_READY',
            message: 'Database connection not initialized'
          }]
        })
      }
    })
    .catch(error => {
      res.status(503).json({
        success: false,
        data: null,
        message: 'Service is not ready',
        errors: [{
          code: 'DATABASE_ERROR',
          message: error instanceof Error ? error.message : 'Database connection failed'
        }]
      })
    })
}

// Health check específico para liveness
export function livenessCheck(req: LoggedRequest, res: Response): void {
  // Verifica se a aplicação está viva
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    message: 'Service is alive'
  })
}

export default {
  basicHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
}
