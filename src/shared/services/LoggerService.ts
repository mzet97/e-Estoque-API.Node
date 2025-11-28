import pino from 'pino'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'

export interface LoggerConfig {
  level: string
  serviceName: string
  serviceVersion: string
  environment: string
  enableRequestLogging: boolean
  enableMetrics: boolean
  redactFields: string[]
  customFields: Record<string, any>
  outputs: {
    console: boolean
    file?: {
      path: string
      maxSize: string
      maxFiles: number
    }
    remote?: {
      url: string
      apiKey?: string
    }
  }
}

export interface LogContext {
  correlationId?: string
  requestId?: string
  userId?: string
  companyId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  method?: string
  url?: string
  statusCode?: number
  responseTime?: number
  [key: string]: any
}

export interface StructuredLog {
  timestamp: string
  level: string
  message: string
  service: string
  version: string
  environment: string
  context: LogContext
  error?: {
    name: string
    message: string
    stack: string
    code?: string
  }
  metrics?: {
    duration?: number
    memoryUsage?: any
    cpuUsage?: number
  }
  business?: {
    event: string
    entity: string
    entityId: string
    data?: any
  }
}

class LoggerService {
  private logger: pino.Logger
  private config: LoggerConfig
  private correlationId: string | null = null
  private requestStartTime: number | null = null

  constructor(config: LoggerConfig) {
    this.config = {
      level: 'info',
      enableRequestLogging: true,
      enableMetrics: true,
      redactFields: ['password', 'token', 'authorization', 'secret', 'key'],
      outputs: {
        console: true
      },
      ...config
    }

    this.logger = this.createLogger()
  }

  private createLogger(): pino.Logger {
    const baseConfig = {
      level: this.config.level,
      base: {
        service: this.config.serviceName,
        version: this.config.serviceVersion,
        environment: this.config.environment,
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'localhost'
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: this.config.redactFields.map(field => `*.${field}`),
        censor: '[REDACTED]'
      },
      formatters: {
        level(label: string) {
          return { level: label }
        }
      },
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err
      }
    }

    // Configure outputs
    const transports: pino.Transport[] = []

    // Console output
    if (this.config.outputs.console) {
      transports.push(pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }))
    }

    // File output
    if (this.config.outputs.file) {
      transports.push(pino.transport({
        target: 'pino-rotating-file-stream',
        options: {
          path: this.config.outputs.file.path,
          size: this.config.outputs.file.maxSize || '100m',
          interval: '1d',
          intervalBracket: '[]',
          maxFiles: this.config.outputs.file.maxFiles || 30,
          gzip: true
        }
      }))
    }

    // Remote output
    if (this.config.outputs.remote) {
      transports.push(pino.transport({
        target: 'pino-http-dashboard',
        options: {
          endpoint: this.config.outputs.remote.url,
          apiKey: this.config.outputs.remote.apiKey
        }
      }))
    }

    return pino(baseConfig, pino.multistream(transports))
  }

  // Core logging methods
  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.buildLogData(message, 'debug', context))
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.buildLogData(message, 'info', context))
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.buildLogData(message, 'warn', context))
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const logData = this.buildLogData(message, 'error', context)
    
    if (error) {
      logData.error = this.serializeError(error)
    }

    this.logger.error(logData)
  }

  fatal(message: string, error?: Error | any, context?: LogContext): void {
    const logData = this.buildLogData(message, 'fatal', context)
    
    if (error) {
      logData.error = this.serializeError(error)
    }

    this.logger.fatal(logData)
  }

  // HTTP Request logging
  startRequest(context: LogContext): void {
    this.requestStartTime = Date.now()
    this.correlationId = context.correlationId || this.generateCorrelationId()
    
    const requestContext = {
      ...context,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString()
    }

    this.info('Request started', requestContext)
  }

  endRequest(context: LogContext & { statusCode: number; responseTime: number }): void {
    const logData = this.buildLogData('Request completed', 'info', context)
    
    logData.metrics = {
      duration: context.responseTime
    }

    logData.context.statusCode = context.statusCode
    logData.context.responseTime = context.responseTime

    // Log at appropriate level based on status code
    if (context.statusCode >= 500) {
      this.error('Server error', null, logData.context)
    } else if (context.statusCode >= 400) {
      this.warn('Client error', logData.context)
    } else {
      this.info('Request completed successfully', logData.context)
    }

    // Reset request tracking
    this.requestStartTime = null
    this.correlationId = null
  }

  // Business event logging
  logBusinessEvent(event: string, entity: string, entityId: string, data?: any, context?: LogContext): void {
    const businessContext = {
      ...context,
      business: {
        event,
        entity,
        entityId,
        data
      }
    }

    this.info(`Business event: ${event}`, businessContext)
  }

  // Security event logging
  logSecurityEvent(event: string, details: any, context?: LogContext): void {
    const securityContext = {
      ...context,
      security: {
        event,
        details,
        timestamp: new Date().toISOString()
      }
    }

    this.warn(`Security event: ${event}`, securityContext)
  }

  // Error logging with context
  logError(error: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      timestamp: new Date().toISOString()
    }

    this.error(error.message || 'Unknown error', error, errorContext)
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const performanceContext = {
      ...context,
      performance: {
        operation,
        duration
      }
    }

    // Log as warning if operation is slow
    if (duration > 5000) { // 5 seconds
      this.warn(`Slow operation: ${operation} took ${duration}ms`, performanceContext)
    } else if (duration > 1000) { // 1 second
      this.info(`Performance: ${operation} took ${duration}ms`, performanceContext)
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, performanceContext)
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, context?: LogContext): void {
    const dbContext = {
      ...context,
      database: {
        operation,
        table,
        duration
      }
    }

    this.logPerformance(`DB ${operation} on ${table}`, duration, dbContext)
  }

  // Cache operation logging
  logCacheOperation(operation: 'get' | 'set' | 'delete', key: string, duration: number, hit: boolean, context?: LogContext): void {
    const cacheContext = {
      ...context,
      cache: {
        operation,
        key,
        hit
      }
    }

    this.logPerformance(`Cache ${operation} for ${key}`, duration, cacheContext)
  }

  // External service logging
  logExternalService(service: string, operation: string, duration: number, success: boolean, context?: LogContext): void {
    const serviceContext = {
      ...context,
      externalService: {
        service,
        operation,
        success
      }
    }

    const message = success 
      ? `External service ${service} ${operation} completed` 
      : `External service ${service} ${operation} failed`

    if (success) {
      this.info(message, serviceContext)
    } else {
      this.error(message, null, serviceContext)
    }
  }

  // Health check logging
  logHealthCheck(component: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any): void {
    const healthContext = {
      health: {
        component,
        status,
        details,
        timestamp: new Date().toISOString()
      }
    }

    const message = `Health check: ${component} is ${status}`
    
    if (status === 'healthy') {
      this.debug(message, healthContext)
    } else if (status === 'degraded') {
      this.warn(message, healthContext)
    } else {
      this.error(message, null, healthContext)
    }
  }

  // Metrics logging
  logMetrics(metrics: Record<string, number>, context?: LogContext): void {
    const metricsContext = {
      ...context,
      metrics: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    }

    this.info('Metrics collected', metricsContext)
  }

  // Correlation ID management
  generateCorrelationId(): string {
    return randomUUID()
  }

  getCorrelationId(): string | null {
    return this.correlationId
  }

  setCorrelationId(id: string): void {
    this.correlationId = id
  }

  // Utility methods
  private buildLogData(message: string, level: string, context?: LogContext): any {
    const logData: any = {
      msg: message,
      level,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      environment: this.config.environment
    }

    if (context) {
      logData.context = {
        ...context,
        correlationId: this.correlationId || context.correlationId
      }
    } else if (this.correlationId) {
      logData.context = { correlationId: this.correlationId }
    }

    // Add custom fields
    if (this.config.customFields) {
      logData.custom = this.config.customFields
    }

    // Add system metrics if enabled
    if (this.config.enableMetrics) {
      logData.system = this.getSystemMetrics()
    }

    return logData
  }

  private serializeError(error: Error | any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    }

    return {
      name: 'UnknownError',
      message: String(error),
      stack: ''
    }
  }

  private getSystemMetrics(): any {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      pid: process.pid,
      nodeVersion: process.version
    }
  }

  // Create middleware for Express
  createHttpMiddleware(): pinoHttp.Options {
    return {
      logger: this.logger,
      genReqId: (req) => {
        const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId()
        return correlationId
      },
      customProps: (req) => {
        return {
          correlationId: req.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString()
        }
      },
      customLogLevel: (res, err) => {
        if (res.statusCode >= 500 || err) {
          return 'error'
        }
        if (res.statusCode >= 400) {
          return 'warn'
        }
        return 'info'
      },
      serializers: {
        req: (req) => {
          return {
            method: req.method,
            url: req.url,
            remoteAddress: req.ip,
            headers: this.sanitizeHeaders(req.headers)
          }
        },
        res: (res) => {
          return {
            statusCode: res.statusCode
          }
        },
        err: (err) => {
          return {
            type: err.name,
            message: err.message,
            stack: err.stack
          }
        }
      }
    }
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers }
    
    this.config.redactFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    return sanitized
  }

  // Child loggers for specific modules
  createChildLogger(additionalFields: Record<string, any>): LoggerService {
    const childLogger = new LoggerService({
      ...this.config,
      customFields: {
        ...this.config.customFields,
        ...additionalFields
      }
    })
    
    childLogger.setCorrelationId(this.correlationId)
    return childLogger
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      this.debug('Health check - logger service', { operation: 'health_check' })
      return true
    } catch (error) {
      return false
    }
  }
}

// Create default logger instance
const createDefaultLogger = (): LoggerService => {
  return new LoggerService({
    level: process.env.LOG_LEVEL || 'info',
    serviceName: process.env.SERVICE_NAME || 'e-estoque-api',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableMetrics: process.env.ENABLE_LOG_METRICS !== 'false',
    outputs: {
      console: true,
      file: process.env.LOG_FILE ? {
        path: process.env.LOG_FILE,
        maxSize: process.env.LOG_MAX_SIZE || '100m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '30')
      } : undefined
    }
  })
}

export { LoggerService, createDefaultLogger }
export default LoggerService