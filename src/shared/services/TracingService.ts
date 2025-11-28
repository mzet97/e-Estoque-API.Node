import { randomUUID, createHash } from 'crypto'
import { AsyncLocalStorage } from 'async_hooks'
import { Request, Response, NextFunction } from 'express'
import RedisClient from '@shared/redis/RedisClient'
import { LoggerService } from './LoggerService'

export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  userId?: string
  companyId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  method?: string
  url?: string
  timestamp: Date
  tags: Record<string, string | number | boolean>
  baggage: Record<string, any>
}

export interface TraceSpan {
  spanId: string
  operationName: string
  startTime: Date
  endTime?: Date
  duration?: number
  tags: Record<string, any>
  logs: TraceLog[]
  status: 'started' | 'finished' | 'error'
  error?: Error
}

export interface TraceLog {
  timestamp: Date
  message: string
  fields: Record<string, any>
}

export interface TracingConfig {
  serviceName: string
  enableTracing: boolean
  enableRedisStorage: boolean
  maxSpansPerTrace: number
  maxLogEntriesPerSpan: number
  traceSamplingRate: number // 0.0 to 1.0
  enableDistributedTracing: boolean
  propagationHeaders: {
    traceId: string
    spanId: string
    parentSpanId: string
    baggage: string
  }
}

export class TracingService {
  private asyncLocalStorage: AsyncLocalStorage<TraceContext>
  private config: TracingConfig
  private redis?: RedisClient
  private logger: LoggerService
  private activeTraces: Map<string, TraceContext> = new Map()
  private activeSpans: Map<string, TraceSpan> = new Map()

  constructor(config: TracingConfig, logger: LoggerService, redis?: RedisClient) {
    this.config = {
      enableTracing: true,
      enableRedisStorage: false,
      maxSpansPerTrace: 1000,
      maxLogEntriesPerSpan: 100,
      traceSamplingRate: 1.0,
      enableDistributedTracing: true,
      propagationHeaders: {
        traceId: 'x-trace-id',
        spanId: 'x-span-id',
        parentSpanId: 'x-parent-span-id',
        baggage: 'x-trace-baggage'
      },
      ...config
    }
    
    this.asyncLocalStorage = new AsyncLocalStorage<TraceContext>()
    this.redis = redis
    this.logger = logger.createChildLogger({ component: 'tracing' })
  }

  // Main tracing methods
  startTrace(context: Partial<TraceContext> = {}): TraceContext {
    if (!this.config.enableTracing) {
      return this.createDummyContext()
    }

    const traceId = context.traceId || this.generateTraceId()
    const spanId = this.generateSpanId()
    
    const traceContext: TraceContext = {
      traceId,
      spanId,
      parentSpanId: context.parentSpanId,
      userId: context.userId,
      companyId: context.companyId,
      sessionId: context.sessionId,
      ip: context.ip,
      userAgent: context.userAgent,
      method: context.method,
      url: context.url,
      timestamp: new Date(),
      tags: context.tags || {},
      baggage: context.baggage || {}
    }

    // Sample trace based on sampling rate
    if (Math.random() > this.config.traceSamplingRate) {
      traceContext.tags.sampled = false
    } else {
      traceContext.tags.sampled = true
      this.activeTraces.set(traceId, traceContext)
    }

    this.logger.info('Trace started', {
      traceId,
      spanId,
      operation: context.tags?.operation || 'unknown'
    })

    return traceContext
  }

  startSpan(operationName: string, tags: Record<string, any> = {}): TraceSpan {
    if (!this.config.enableTracing) {
      return this.createDummySpan(operationName)
    }

    const context = this.asyncLocalStorage.getStore()
    if (!context) {
      this.logger.warn('Attempted to start span outside trace context')
      return this.createDummySpan(operationName)
    }

    const spanId = this.generateSpanId()
    const span: TraceSpan = {
      spanId,
      operationName,
      startTime: new Date(),
      tags: { ...tags, service: this.config.serviceName },
      logs: [],
      status: 'started'
    }

    this.activeSpans.set(`${context.traceId}:${spanId}`, span)

    this.logger.debug('Span started', {
      traceId: context.traceId,
      spanId,
      operationName
    })

    return span
  }

  finishSpan(span: TraceSpan, status: 'finished' | 'error' = 'finished', error?: Error): void {
    if (!this.config.enableTracing) {
      return
    }

    span.endTime = new Date()
    span.duration = span.endTime.getTime() - span.startTime.getTime()
    span.status = status

    if (error) {
      span.error = error
      this.logSpanEvent(span, 'error', { error: error.message, stack: error.stack })
    }

    const context = this.asyncLocalStorage.getStore()
    if (context) {
      this.storeSpan(context.traceId, span)
    }

    this.logger.debug('Span finished', {
      traceId: context?.traceId,
      spanId: span.spanId,
      operationName: span.operationName,
      duration: span.duration,
      status
    })
  }

  // Logging and tagging
  logSpanEvent(span: TraceSpan, message: string, fields: Record<string, any> = {}): void {
    if (!this.config.enableTracing) {
      return
    }

    const logEntry: TraceLog = {
      timestamp: new Date(),
      message,
      fields
    }

    span.logs.push(logEntry)

    // Limit log entries
    if (span.logs.length > this.config.maxLogEntriesPerSpan) {
      span.logs = span.logs.slice(-this.config.maxLogEntriesPerSpan)
    }

    this.logger.debug(`Span log: ${message}`, {
      traceId: this.getCurrentTraceId(),
      spanId: span.spanId,
      operation: span.operationName,
      fields
    })
  }

  setSpanTag(span: TraceSpan, key: string, value: string | number | boolean): void {
    span.tags[key] = value
  }

  setTraceTag(key: string, value: string | number | boolean): void {
    const context = this.asyncLocalStorage.getStore()
    if (context) {
      context.tags[key] = value
    }
  }

  setTraceBaggage(key: string, value: any): void {
    const context = this.asyncLocalStorage.getStore()
    if (context) {
      context.baggage[key] = value
    }
  }

  getTraceBaggage(key: string): any {
    const context = this.asyncLocalStorage.getStore()
    return context?.baggage[key]
  }

  // HTTP middleware
  createExpressMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableTracing) {
        return next()
      }

      // Extract or create trace context from headers
      const traceId = this.extractTraceId(req)
      const parentSpanId = this.extractSpanId(req)
      const baggage = this.extractBaggage(req)

      const traceContext = this.startTrace({
        traceId,
        parentSpanId,
        userId: (req as any).user?.id,
        companyId: (req as any).user?.companyId,
        sessionId: req.headers['x-session-id'] as string,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        tags: {
          httpMethod: req.method,
          httpUrl: req.originalUrl,
          httpHost: req.get('host'),
          httpScheme: req.protocol
        },
        baggage
      })

      // Set trace context in AsyncLocalStorage
      this.asyncLocalStorage.run(traceContext, () => {
        // Add trace headers to response
        res.setHeader(this.config.propagationHeaders.traceId, traceContext.traceId)
        res.setHeader(this.config.propagationHeaders.spanId, traceContext.spanId)

        // End trace when response finishes
        res.on('finish', () => {
          this.finishTrace(traceContext)
        })

        next()
      })
    }
  }

  // Distributed tracing
  injectTraceHeaders(headers: Record<string, string>): Record<string, string> {
    if (!this.config.enableDistributedTracing) {
      return headers
    }

    const context = this.asyncLocalStorage.getStore()
    if (!context) {
      return headers
    }

    const traceHeaders = {
      [this.config.propagationHeaders.traceId]: context.traceId,
      [this.config.propagationHeaders.spanId]: context.spanId
    }

    if (context.parentSpanId) {
      traceHeaders[this.config.propagationHeaders.parentSpanId] = context.parentSpanId
    }

    // Add baggage if present
    if (Object.keys(context.baggage).length > 0) {
      traceHeaders[this.config.propagationHeaders.baggage] = Buffer.from(
        JSON.stringify(context.baggage)
      ).toString('base64')
    }

    return { ...headers, ...traceHeaders }
  }

  // Request/response tracing wrapper
  traceRequest<T extends (...args: any[]) => Promise<any>>(
    operationName: string,
    func: T,
    tags: Record<string, any> = {}
  ): T {
    if (!this.config.enableTracing) {
      return func
    }

    return (async (...args: any[]) => {
      const span = this.startSpan(operationName, tags)
      
      try {
        const result = await func(...args)
        
        // Add response tags
        if (result && typeof result === 'object') {
          if ('statusCode' in result) {
            this.setSpanTag(span, 'http.status_code', result.statusCode)
          }
          if ('success' in result) {
            this.setSpanTag(span, 'success', result.success)
          }
        }

        this.finishSpan(span, 'finished')
        return result
      } catch (error) {
        this.finishSpan(span, 'error', error as Error)
        throw error
      }
    }) as T
  }

  // Storage and retrieval
  private async storeSpan(traceId: string, span: TraceSpan): Promise<void> {
    if (!this.config.enableRedisStorage || !this.redis) {
      return
    }

    try {
      const key = `trace:${traceId}`
      const spanData = {
        ...span,
        startTime: span.startTime.toISOString(),
        endTime: span.endTime?.toISOString(),
        logs: span.logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        }))
      }

      await this.redis.setex(key, 3600, JSON.stringify(spanData)) // 1 hour retention
    } catch (error) {
      this.logger.warn('Failed to store trace span', { error })
    }
  }

  async getTrace(traceId: string): Promise<any> {
    if (!this.config.enableRedisStorage || !this.redis) {
      return null
    }

    try {
      const data = await this.redis.get(`trace:${traceId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      this.logger.error('Failed to retrieve trace', { error, traceId })
      return null
    }
  }

  async getTraceSummary(traceId: string): Promise<any> {
    const trace = await this.getTrace(traceId)
    if (!trace) {
      return null
    }

    return {
      traceId,
      spans: trace.length,
      duration: trace.duration,
      errorCount: trace.filter((span: any) => span.error).length,
      serviceCount: new Set(trace.map((span: any) => span.tags?.service)).size
    }
  }

  private finishTrace(traceContext: TraceContext): void {
    if (!traceContext.tags.sampled) {
      return
    }

    this.activeTraces.delete(traceContext.traceId)
    this.logger.info('Trace finished', {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      duration: Date.now() - traceContext.timestamp.getTime()
    })
  }

  // Utility methods
  private generateTraceId(): string {
    return randomUUID()
  }

  private generateSpanId(): string {
    return randomUUID().replace(/-/g, '').substring(0, 16)
  }

  private extractTraceId(req: Request): string {
    const headerTraceId = req.headers[this.config.propagationHeaders.traceId.toLowerCase()] as string
    return headerTraceId || this.generateTraceId()
  }

  private extractSpanId(req: Request): string | undefined {
    const headerSpanId = req.headers[this.config.propagationHeaders.spanId.toLowerCase()] as string
    return headerSpanId || undefined
  }

  private extractBaggage(req: Request): Record<string, any> {
    const headerBaggage = req.headers[this.config.propagationHeaders.baggage.toLowerCase()] as string
    if (headerBaggage) {
      try {
        const decoded = Buffer.from(headerBaggage, 'base64').toString('utf-8')
        return JSON.parse(decoded)
      } catch (error) {
        this.logger.warn('Failed to parse trace baggage', { error })
      }
    }
    return {}
  }

  private createDummyContext(): TraceContext {
    return {
      traceId: 'dummy',
      spanId: 'dummy',
      timestamp: new Date(),
      tags: {},
      baggage: {}
    }
  }

  private createDummySpan(operationName: string): TraceSpan {
    return {
      spanId: 'dummy',
      operationName,
      startTime: new Date(),
      tags: {},
      logs: [],
      status: 'started'
    }
  }

  // Public getters
  getCurrentTraceId(): string | null {
    const context = this.asyncLocalStorage.getStore()
    return context?.traceId || null
  }

  getCurrentSpanId(): string | null {
    const context = this.asyncLocalStorage.getStore()
    return context?.spanId || null
  }

  getCurrentTraceContext(): TraceContext | null {
    return this.asyncLocalStorage.getStore() || null
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      if (this.config.enableRedisStorage && this.redis) {
        await this.redis.ping()
      }
      return true
    } catch (error) {
      return false
    }
  }
}

export default TracingService