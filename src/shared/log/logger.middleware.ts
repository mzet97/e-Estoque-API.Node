import { Request, Response, NextFunction } from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import { v4 as uuidv4 } from 'uuid'

// Configuração do logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label }
    }
  },
  serializers: {
    req(req) {
      // Remove sensitive data from request
      const { headers, body, ...rest } = req as any
      const sanitizedHeaders = { ...headers }
      delete sanitizedHeaders.authorization
      delete sanitizedHeaders.cookie
      
      return {
        ...rest,
        method: req.method,
        url: req.url,
        headers: sanitizedHeaders,
        body: req.method !== 'GET' ? '[REDACTED]' : undefined
      }
    },
    res(res) {
      return { statusCode: res.statusCode }
    },
    err(err) {
      return {
        type: err.type,
        message: err.message,
        stack: err.stack
      }
    }
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
})

// Interface estendida para Request com logger
export interface LoggedRequest extends Request {
  log: pino.Logger
  requestId: string
}

// Middleware de logging HTTP
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error'
    }
    if (res.statusCode >= 400) {
      return 'warn'
    }
    return 'info'
  },
  customSuccessMessage: (res) => {
    if (res.statusCode >= 400) {
      return 'HTTP error'
    }
    return 'HTTP request completed'
  },
  customAttributeKeys: {
    responseTime: 'responseTime'
  },
  autoLogging: {
    ignore: (req) => {
      // Ignore health checks and static files
      return req.url === '/health' || req.url.startsWith('/static')
    }
  },
  serializers: {
    req(req) {
      const { method, url, headers, socket, ip } = req
      const userAgent = headers['user-agent']
      return { method, url, headers, remoteAddress: ip, userAgent }
    },
    res(res) {
      const { statusCode } = res
      return { statusCode }
    },
    err(err) {
      return { 
        type: err.type, 
        message: err.message, 
        stack: err.stack 
      }
    }
  }
})

// Middleware para adicionar correlation ID
export function correlationId(req: LoggedRequest, res: Response, next: NextFunction) {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4()
  req.requestId = correlationId
  res.setHeader('x-correlation-id', correlationId)
  req.log = logger.child({ correlationId })
  next()
}

// Função para logging de business events
export function logBusinessEvent(log: pino.Logger, event: string, data: any) {
  log.info({ event, ...data }, `Business event: ${event}`)
}

// Função para logging de métricas
export function logMetrics(log: pino.Logger, metrics: Record<string, number>) {
  log.info({ metrics }, 'Application metrics')
}

// Função para logging de erros com contexto
export function logError(log: pino.Logger, error: Error, context?: any) {
  log.error({ 
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context 
  }, 'Application error occurred')
}

// Função para logging de performance
export function logPerformance(log: pino.Logger, operation: string, duration: number, context?: any) {
  log.info({ 
    operation, 
    duration, 
    context 
  }, `Performance metric: ${operation}`)
}

// Função para logging de auditoria
export function logAudit(log: pino.Logger, action: string, userId: string, resource: string, changes?: any) {
  log.info({ 
    action, 
    userId, 
    resource, 
    changes 
  }, `Audit log: ${action} on ${resource}`)
}

// Função para logging de segurança
export function logSecurity(log: pino.Logger, event: string, details: any) {
  log.warn({ 
    securityEvent: event, 
    ...details 
  }, `Security event: ${event}`)
}

export default {
  logger,
  httpLogger,
  correlationId,
  logBusinessEvent,
  logMetrics,
  logError,
  logPerformance,
  logAudit,
  logSecurity
}
