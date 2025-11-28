import { Request, Response, NextFunction } from 'express'
import winston from 'winston'
import { RedisClient } from '@shared/redis/RedisClient'

// Log levels configuration
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOG_LEVELS,
  format: logFormat,
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for persistent logging
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
})

// Request logging configuration
interface RequestLogData {
  timestamp: string
  method: string
  url: string
  originalUrl: string
  ip: string
  userAgent?: string
  userId?: string
  userTier?: string
  contentLength?: number
  responseTime: number
  statusCode: number
  contentLength?: number
  referer?: string
  correlationId?: string
  serviceName?: string
  endpoint?: string
  error?: string
  stack?: string
}

class RequestLoggingMiddleware {
  private redis: RedisClient

  constructor() {
    this.redis = RedisClient.getInstance()
    this.startPeriodicCleanup()
  }

  /**
   * Main request logging middleware
   */
  createRequestLogger() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now()
      const correlationId = this.generateCorrelationId()
      
      // Attach correlation ID to request
      ;(req as any).correlationId = correlationId
      
      // Get client information
      const clientInfo = this.extractClientInfo(req)
      
      // Override res.json to capture response data
      const originalJson = res.json.bind(res)
      const originalSend = res.send.bind(res)
      
      let responseData: any = null
      
      res.json = function(body: any) {
        responseData = body
        return originalJson(body)
      }
      
      res.send = function(body: any) {
        if (!responseData && body) {
          responseData = body
        }
        return originalSend(body)
      }

      // Log request start
      this.logRequestStart(req, clientInfo, correlationId)

      // Capture response
      const originalEnd = res.end.bind(res)
      res.end = (chunk?: any, encoding?: any) => {
        const duration = Date.now() - start
        
        // Log request completion
        this.logRequestEnd(req, res, {
          ...clientInfo,
          correlationId,
          responseTime: duration,
          responseData: this.shouldLogResponseData(req, res) ? responseData : undefined
        })

        // Store request data in Redis for analytics
        this.storeRequestData(req, res, {
          ...clientInfo,
          correlationId,
          responseTime: duration,
          statusCode: res.statusCode
        })

        return originalEnd(chunk, encoding)
      }

      next()
    }
  }

  /**
   * Error logging middleware
   */
  createErrorLogger() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const correlationId = (req as any).correlationId || this.generateCorrelationId()
      const clientInfo = this.extractClientInfo(req)
      
      const errorLogData = {
        ...clientInfo,
        correlationId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        level: 'error'
      }

      // Log error with Winston
      logger.error('Request error', errorLogData)

      // Store error data for monitoring
      this.storeErrorData(req, error, correlationId)

      next(error)
    }
  }

  /**
   * Business event logging
   */
  logBusinessEvent(eventType: string, data: any, userId?: string, correlationId?: string) {
    const eventData = {
      eventType,
      data,
      userId,
      correlationId: correlationId || this.generateCorrelationId(),
      timestamp: new Date().toISOString(),
      level: 'info'
    }

    logger.info(`Business event: ${eventType}`, eventData)
    
    // Store in Redis for real-time processing
    this.storeBusinessEvent(eventType, eventData)
  }

  /**
   * Security event logging
   */
  logSecurityEvent(eventType: string, data: any, req: Request) {
    const clientInfo = this.extractClientInfo(req)
    
    const securityEvent = {
      eventType,
      data,
      ...clientInfo,
      timestamp: new Date().toISOString(),
      level: 'warn'
    }

    logger.warn(`Security event: ${eventType}`, securityEvent)
    
    // Critical security events should be logged immediately
    if (['UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'].includes(eventType)) {
      logger.error(`CRITICAL SECURITY EVENT: ${eventType}`, securityEvent)
    }
    
    this.storeSecurityEvent(eventType, securityEvent)
  }

  /**
   * Performance monitoring logging
   */
  logPerformanceMetrics(metrics: {
    endpoint: string
    method: string
    responseTime: number
    statusCode: number
    userTier?: string
    serviceName?: string
  }) {
    const performanceData = {
      ...metrics,
      timestamp: new Date().toISOString(),
      level: 'info'
    }

    logger.info('Performance metrics', performanceData)
    
    // Store performance data for monitoring dashboard
    this.storePerformanceData(metrics)
  }

  /**
   * Audit logging for sensitive operations
   */
  logAuditEvent(action: string, resource: string, userId: string, details: any, req: Request) {
    const clientInfo = this.extractClientInfo(req)
    
    const auditEvent = {
      action,
      resource,
      userId,
      details,
      ...clientInfo,
      timestamp: new Date().toISOString(),
      level: 'info'
    }

    logger.info(`Audit event: ${action}`, auditEvent)
    this.storeAuditEvent(auditEvent)
  }

  private logRequestStart(req: Request, clientInfo: any, correlationId: string) {
    const logData = {
      ...clientInfo,
      correlationId,
      event: 'request_start',
      timestamp: new Date().toISOString(),
      level: 'info'
    }

    logger.info('Request started', logData)
  }

  private logRequestEnd(req: Request, res: Response, data: any) {
    const logData = {
      ...data,
      event: 'request_end',
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'warn' : 'info'
    }

    logger.info('Request completed', logData)
  }

  private extractClientInfo(req: Request) {
    return {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      contentLength: parseInt(req.get('Content-Length') || '0'),
      userId: (req as any).userId,
      userTier: (req as any).userTier || 'anonymous',
      serviceName: (req as any).serviceInfo?.name,
      endpoint: this.extractEndpoint(req.path)
    }
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return (req.ip || req.connection.remoteAddress || 'unknown').replace(/^::ffff:/, '')
  }

  private extractEndpoint(path: string): string {
    // Remove version and extract meaningful endpoint
    const parts = path.split('/').filter(p => p && !p.match(/^v\d+$/))
    return parts.join('/') || '/'
  }

  private shouldLogResponseData(req: Request, res: Response): boolean {
    // Only log response data for errors or specific endpoints
    if (res.statusCode >= 400) return true
    
    const sensitiveEndpoints = ['/auth', '/admin', '/users']
    return sensitiveEndpoints.some(endpoint => req.path.includes(endpoint))
  }

  private async storeRequestData(req: Request, res: Response, data: any) {
    try {
      const key = `logs:requests:${data.correlationId}`
      const expiry = 3600 * 24 // 24 hours
      
      await this.redis.setex(key, expiry, JSON.stringify(data))
      
      // Store in time-series structure for analytics
      const timeKey = `analytics:requests:${new Date().toISOString().slice(0, 13)}:00`
      await this.redis.hincrby(timeKey, 'count', 1)
      await this.redis.expire(timeKey, 7 * 24 * 3600) // 7 days
    } catch (error) {
      logger.error('Failed to store request data', { error: error.message })
    }
  }

  private async storeErrorData(req: Request, error: Error, correlationId: string) {
    try {
      const key = `logs:errors:${correlationId}`
      const expiry = 7 * 24 * 3600 // 7 days
      
      await this.redis.setex(key, expiry, JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        ip: this.getClientIP(req)
      }))
    } catch (err) {
      logger.error('Failed to store error data', { error: err.message })
    }
  }

  private async storeBusinessEvent(eventType: string, eventData: any) {
    try {
      const key = `analytics:business:${eventType}:${Date.now()}`
      const expiry = 30 * 24 * 3600 // 30 days
      
      await this.redis.setex(key, expiry, JSON.stringify(eventData))
    } catch (error) {
      logger.error('Failed to store business event', { error: error.message })
    }
  }

  private async storeSecurityEvent(eventType: string, eventData: any) {
    try {
      const key = `security:events:${eventType}:${Date.now()}`
      const expiry = 90 * 24 * 3600 // 90 days (compliance requirement)
      
      await this.redis.setex(key, expiry, JSON.stringify(eventData))
    } catch (error) {
      logger.error('Failed to store security event', { error: error.message })
    }
  }

  private async storePerformanceData(metrics: any) {
    try {
      const timeKey = `performance:${metrics.endpoint}:${new Date().toISOString().slice(0, 13)}:00`
      const expiry = 7 * 24 * 3600 // 7 days
      
      await this.redis.hincrby(timeKey, 'count', 1)
      await this.redis.hincrbyfloat(timeKey, 'totalTime', metrics.responseTime)
      await this.redis.expire(timeKey, expiry)
    } catch (error) {
      logger.error('Failed to store performance data', { error: error.message })
    }
  }

  private async storeAuditEvent(auditEvent: any) {
    try {
      const key = `audit:${auditEvent.action}:${auditEvent.userId}:${Date.now()}`
      const expiry = 365 * 24 * 3600 // 1 year (compliance requirement)
      
      await this.redis.setex(key, expiry, JSON.stringify(auditEvent))
    } catch (error) {
      logger.error('Failed to store audit event', { error: error.message })
    }
  }

  private startPeriodicCleanup() {
    // Clean up old logs periodically
    setInterval(async () => {
      try {
        const pattern = 'logs:requests:*'
        const keys = await this.redis.keys(pattern)
        
        // Keep only recent logs (delete older than 24 hours)
        for (const key of keys) {
          const ttl = await this.redis.ttl(key)
          if (ttl > 0 && ttl > 86400) { // 24 hours
            await this.redis.del(key)
          }
        }
      } catch (error) {
        logger.error('Failed to cleanup old logs', { error: error.message })
      }
    }, 3600000) // Run every hour
  }

  /**
   * Get request logs for debugging
   */
  async getRequestLogs(correlationId: string) {
    try {
      const key = `logs:requests:${correlationId}`
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Failed to get request logs', { error: error.message })
      return null
    }
  }

  /**
   * Get error logs for monitoring
   */
  async getErrorLogs(timeframe: string = '1h') {
    try {
      const pattern = 'logs:errors:*'
      const keys = await this.redis.keys(pattern)
      
      const errors = []
      const timeframeMs = this.parseTimeframe(timeframe)
      const cutoff = Date.now() - timeframeMs
      
      for (const key of keys) {
        const data = await this.redis.get(key)
        if (data) {
          const parsed = JSON.parse(data)
          const timestamp = new Date(parsed.timestamp).getTime()
          if (timestamp > cutoff) {
            errors.push(parsed)
          }
        }
      }
      
      return errors.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      logger.error('Failed to get error logs', { error: error.message })
      return []
    }
  }

  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([smhd])$/)
    if (!match) return 3600000 // Default 1 hour
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 3600000
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(timeframe: string = '1h') {
    try {
      const timeframeMs = this.parseTimeframe(timeframe)
      const buckets = Math.min(Math.floor(timeframeMs / (60 * 60 * 1000)), 24) // Max 24 buckets
      
      const summary = {
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        errorsByType: {}
      }
      
      // Aggregate data from time-series keys
      for (let i = 0; i < buckets; i++) {
        const time = new Date(Date.now() - (i * 60 * 60 * 1000))
        const timeKey = `analytics:requests:${time.toISOString().slice(0, 13)}:00`
        
        // This would require more complex aggregation logic
        // For now, return basic summary
      }
      
      return summary
    } catch (error) {
      logger.error('Failed to get analytics summary', { error: error.message })
      return null
    }
  }
}

export default new RequestLoggingMiddleware()

// Export middleware functions
export const {
  createRequestLogger,
  createErrorLogger,
  logBusinessEvent,
  logSecurityEvent,
  logPerformanceMetrics,
  logAuditEvent,
  getRequestLogs,
  getErrorLogs,
  getAnalyticsSummary
} = new RequestLoggingMiddleware()

// Export logger instance for direct use
export { logger }