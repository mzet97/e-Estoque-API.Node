import { Request, Response, NextFunction } from 'express'
import { RedisClient } from '@shared/redis/RedisClient'
import { EventEmitter } from 'events'

// Performance thresholds for alerts
const PERFORMANCE_THRESHOLDS = {
  responseTime: {
    warning: 1000, // 1 second
    critical: 5000 // 5 seconds
  },
  memoryUsage: {
    warning: 80, // 80%
    critical: 90 // 90%
  },
  cpuUsage: {
    warning: 70, // 70%
    critical: 85 // 85%
  },
  errorRate: {
    warning: 5, // 5%
    critical: 10 // 10%
  },
  throughput: {
    minWarning: 100, // requests per minute
    maxWarning: 10000 // requests per minute
  }
}

interface PerformanceMetrics {
  timestamp: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  requestSize: number
  responseSize: number
  userId?: string
  userTier?: string
  serviceName?: string
  error?: string
  cacheHit?: boolean
  rateLimited?: boolean
}

interface SystemMetrics {
  timestamp: string
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    loadAverage: number[]
  }
  network: {
    requestsPerSecond: number
    bytesIn: number
    bytesOut: number
  }
  database: {
    connections: number
    queryTime: number
    errorRate: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
  }
}

class PerformanceMonitoringMiddleware extends EventEmitter {
  private redis: RedisClient
  private metricsBuffer: PerformanceMetrics[] = []
  private systemMetrics: SystemMetrics
  private maxBufferSize = 1000
  private flushInterval = 5000 // 5 seconds
  private alertCooldown = 300000 // 5 minutes

  constructor() {
    super()
    this.redis = RedisClient.getInstance()
    this.initializeSystemMetrics()
    this.startPeriodicFlush()
    this.startSystemMonitoring()
  }

  private initializeSystemMetrics() {
    this.systemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0]
      },
      network: {
        requestsPerSecond: 0,
        bytesIn: 0,
        bytesOut: 0
      },
      database: {
        connections: 0,
        queryTime: 0,
        errorRate: 0
      },
      cache: {
        hitRate: 0,
        memoryUsage: 0
      }
    }
  }

  /**
   * Main performance monitoring middleware
   */
  createPerformanceMiddleware() {
    const startTime = process.hrtime.bigint()

    return async (req: Request, res: Response, next: NextFunction) => {
      const requestId = this.generateRequestId(req)
      const startMemory = process.memoryUsage()
      
      // Override res.end to capture metrics
      const originalEnd = res.end.bind(res)
      let responseSize = 0

      res.end = ((chunk?: any, encoding?: any) => {
        const endTime = process.hrtime.bigint()
        const responseTime = Number(endTime - startTime) / 1000000 // Convert to milliseconds
        const endMemory = process.memoryUsage()
        
        // Calculate response size
        if (chunk) {
          responseSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
        }

        // Capture performance metrics
        const metrics: PerformanceMetrics = {
          timestamp: new Date().toISOString(),
          endpoint: this.extractEndpoint(req.path),
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
          cpuUsage: await this.getCpuUsage(),
          activeConnections: this.getActiveConnections(),
          requestSize: parseInt(req.get('Content-Length') || '0'),
          responseSize,
          userId: (req as any).userId,
          userTier: (req as any).userTier || 'anonymous',
          serviceName: (req as any).serviceInfo?.name,
          error: res.statusCode >= 400 ? 'HTTP_ERROR' : undefined,
          cacheHit: (req as any).cacheHit,
          rateLimited: (req as any).rateLimited
        }

        // Store metrics
        this.storeMetrics(metrics)

        // Check for performance alerts
        this.checkPerformanceAlerts(metrics)

        return originalEnd(chunk, encoding)
      })()

      // Add request ID to request for tracing
      ;(req as any).requestId = requestId
      ;(req as any).startTime = startTime

      next()
    }
  }

  private generateRequestId(req: Request): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractEndpoint(path: string): string {
    // Remove version prefix and extract meaningful endpoint
    const cleanPath = path.replace(/^\/v\d+/, '')
    const parts = cleanPath.split('/').filter(p => p && !p.match(/^[a-f0-9-]+$/))
    return parts.join('/') || '/'
  }

  private async getCpuUsage(): Promise<number> {
    try {
      // Simple CPU usage calculation
      const usage = process.cpuUsage()
      // This is a simplified calculation - in production, you'd use a more sophisticated approach
      return Math.min(100, (usage.user + usage.system) / 1000)
    } catch (error) {
      return 0
    }
  }

  private getActiveConnections(): number {
    // This would require connection tracking - simplified for example
    return 0
  }

  private async storeMetrics(metrics: PerformanceMetrics) {
    try {
      // Add to buffer for batch processing
      this.metricsBuffer.push(metrics)

      // Store individual metric with TTL
      const metricKey = `performance:metric:${metrics.timestamp}:${Math.random()}`
      await this.redis.setex(metricKey, 3600, JSON.stringify(metrics)) // 1 hour TTL

      // Update real-time aggregates
      await this.updateRealTimeAggregates(metrics)

      // Store endpoint-specific metrics
      await this.storeEndpointMetrics(metrics)

      // Store user-tier metrics
      if (metrics.userTier) {
        await this.storeUserTierMetrics(metrics)
      }

    } catch (error) {
      console.error('Failed to store performance metrics:', error)
    }
  }

  private async updateRealTimeAggregates(metrics: PerformanceMetrics) {
    const timestamp = new Date()
    const minuteKey = `performance:aggregates:minute:${timestamp.toISOString().slice(0, 16)}`
    const hourKey = `performance:aggregates:hour:${timestamp.toISOString().slice(0, 13)}`
    const dayKey = `performance:aggregates:day:${timestamp.toISOString().slice(0, 10)}`

    const updates = [
      { key: `${minuteKey}:count`, value: 1 },
      { key: `${minuteKey}:totalResponseTime`, value: metrics.responseTime },
      { key: `${hourKey}:count`, value: 1 },
      { key: `${hourKey}:totalResponseTime`, value: metrics.responseTime },
      { key: `${dayKey}:count`, value: 1 },
      { key: `${dayKey}:totalResponseTime`, value: metrics.responseTime }
    ]

    // Update error count if status >= 400
    if (metrics.statusCode >= 400) {
      updates.push(
        { key: `${minuteKey}:errors`, value: 1 },
        { key: `${hourKey}:errors`, value: 1 },
        { key: `${dayKey}:errors`, value: 1 }
      )
    }

    for (const update of updates) {
      await this.redis.incrbyfloat(update.key, update.value)
      await this.redis.expire(update.key, 24 * 3600) // 24 hours
    }
  }

  private async storeEndpointMetrics(metrics: PerformanceMetrics) {
    const endpointKey = `performance:endpoints:${metrics.endpoint}`
    
    await this.redis.hincrby(`${endpointKey}:count`, 'total', 1)
    await this.redis.hincrbyfloat(`${endpointKey}:totalResponseTime`, 'sum', metrics.responseTime)
    await this.redis.hincrby(`${endpointKey}:statusCodes`, metrics.statusCode.toString(), 1)
    
    if (metrics.statusCode >= 400) {
      await this.redis.hincrby(`${endpointKey}:errors`, 'count', 1)
    }

    // Update peak response time
    const currentPeak = await this.redis.get(`${endpointKey}:peakResponseTime`)
    if (!currentPeak || metrics.responseTime > parseFloat(currentPeak)) {
      await this.redis.set(`${endpointKey}:peakResponseTime`, metrics.responseTime.toString())
    }

    await this.redis.expire(endpointKey, 7 * 24 * 3600) // 7 days
  }

  private async storeUserTierMetrics(metrics: PerformanceMetrics) {
    if (!metrics.userTier) return

    const tierKey = `performance:userTiers:${metrics.userTier}`
    
    await this.redis.hincrby(`${tierKey}:count`, 'total', 1)
    await this.redis.hincrbyfloat(`${tierKey}:totalResponseTime`, 'sum', metrics.responseTime)
    
    await this.redis.expire(tierKey, 30 * 24 * 3600) // 30 days
  }

  private startPeriodicFlush() {
    setInterval(async () => {
      if (this.metricsBuffer.length > 0) {
        // Flush metrics buffer to persistent storage
        // In production, this would be sent to external monitoring service
        console.log(`Flushing ${this.metricsBuffer.length} performance metrics`)
        this.metricsBuffer = []
      }
    }, this.flushInterval)
  }

  private startSystemMonitoring() {
    setInterval(async () => {
      try {
        await this.updateSystemMetrics()
        await this.checkSystemAlerts()
      } catch (error) {
        console.error('Error in system monitoring:', error)
      }
    }, 30000) // Every 30 seconds
  }

  private async updateSystemMetrics() {
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    this.systemMetrics = {
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0]
      },
      network: {
        requestsPerSecond: await this.getRequestsPerSecond(),
        bytesIn: 0, // Would be calculated from network interface
        bytesOut: 0
      },
      database: {
        connections: await this.getDatabaseConnections(),
        queryTime: await this.getAverageQueryTime(),
        errorRate: await this.getErrorRate()
      },
      cache: {
        hitRate: await this.getCacheHitRate(),
        memoryUsage: await this.getCacheMemoryUsage()
      }
    }

    // Store system metrics
    await this.storeSystemMetrics()
  }

  private async getRequestsPerSecond(): Promise<number> {
    try {
      const minuteKey = `performance:aggregates:minute:${new Date().toISOString().slice(0, 16)}`
      const count = await this.redis.get(`${minuteKey}:count`)
      return count ? parseInt(count) / 60 : 0
    } catch (error) {
      return 0
    }
  }

  private async getDatabaseConnections(): Promise<number> {
    // This would connect to your database to get connection count
    return 0 // Placeholder
  }

  private async getAverageQueryTime(): Promise<number> {
    // This would calculate average query time from database monitoring
    return 0 // Placeholder
  }

  private async getErrorRate(): Promise<number> {
    try {
      const hourKey = `performance:aggregates:hour:${new Date().toISOString().slice(0, 13)}`
      const [totalCount, errorCount] = await Promise.all([
        this.redis.get(`${hourKey}:count`),
        this.redis.get(`${hourKey}:errors`)
      ])
      
      const total = parseInt(totalCount || '0')
      const errors = parseInt(errorCount || '0')
      
      return total > 0 ? (errors / total) * 100 : 0
    } catch (error) {
      return 0
    }
  }

  private async getCacheHitRate(): Promise<number> {
    // This would calculate cache hit rate from your cache system
    return 0 // Placeholder
  }

  private async getCacheMemoryUsage(): Promise<number> {
    // This would get cache memory usage
    return 0 // Placeholder
  }

  private async storeSystemMetrics() {
    try {
      const key = `performance:system:${this.systemMetrics.timestamp}`
      await this.redis.setex(key, 3600, JSON.stringify(this.systemMetrics))
    } catch (error) {
      console.error('Failed to store system metrics:', error)
    }
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    const alerts: string[] = []

    // Check response time thresholds
    if (metrics.responseTime > PERFORMANCE_THRESHOLDS.responseTime.critical) {
      alerts.push(`CRITICAL: Response time ${metrics.responseTime}ms exceeds critical threshold`)
      this.emitAlert('CRITICAL_RESPONSE_TIME', metrics)
    } else if (metrics.responseTime > PERFORMANCE_THRESHOLDS.responseTime.warning) {
      alerts.push(`WARNING: Response time ${metrics.responseTime}ms exceeds warning threshold`)
      this.emitAlert('HIGH_RESPONSE_TIME', metrics)
    }

    // Check error rate (would need aggregate calculation)
    // This would require checking recent error rates

    // Emit alerts for monitoring
    if (alerts.length > 0) {
      this.emit('performanceAlert', {
        type: 'THRESHOLD_EXCEEDED',
        metrics,
        alerts,
        timestamp: new Date().toISOString()
      })
    }
  }

  private async checkSystemAlerts() {
    const alerts: string[] = []

    // Check memory usage
    if (this.systemMetrics.memory.percentage > PERFORMANCE_THRESHOLDS.memoryUsage.critical) {
      alerts.push(`CRITICAL: Memory usage ${this.systemMetrics.memory.percentage.toFixed(1)}% exceeds critical threshold`)
      this.emitAlert('CRITICAL_MEMORY_USAGE', this.systemMetrics)
    } else if (this.systemMetrics.memory.percentage > PERFORMANCE_THRESHOLDS.memoryUsage.warning) {
      alerts.push(`WARNING: Memory usage ${this.systemMetrics.memory.percentage.toFixed(1)}% exceeds warning threshold`)
      this.emitAlert('HIGH_MEMORY_USAGE', this.systemMetrics)
    }

    // Check CPU usage
    if (this.systemMetrics.cpu.usage > PERFORMANCE_THRESHOLDS.cpuUsage.critical) {
      alerts.push(`CRITICAL: CPU usage ${this.systemMetrics.cpu.usage.toFixed(1)}% exceeds critical threshold`)
      this.emitAlert('CRITICAL_CPU_USAGE', this.systemMetrics)
    } else if (this.systemMetrics.cpu.usage > PERFORMANCE_THRESHOLDS.cpuUsage.warning) {
      alerts.push(`WARNING: CPU usage ${this.systemMetrics.cpu.usage.toFixed(1)}% exceeds warning threshold`)
      this.emitAlert('HIGH_CPU_USAGE', this.systemMetrics)
    }

    if (alerts.length > 0) {
      this.emit('systemAlert', {
        type: 'SYSTEM_THRESHOLD_EXCEEDED',
        systemMetrics: this.systemMetrics,
        alerts,
        timestamp: new Date().toISOString()
      })
    }
  }

  private emitAlert(alertType: string, data: any) {
    this.emit('performanceAlert', {
      type: alertType,
      data,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get current performance metrics for dashboard
   */
  async getCurrentPerformance() {
    try {
      const now = new Date()
      
      // Get aggregate metrics for last 5 minutes
      const minuteKey = `performance:aggregates:minute:${now.toISOString().slice(0, 16)}`
      const [count, totalResponseTime, errors] = await Promise.all([
        this.redis.get(`${minuteKey}:count`),
        this.redis.get(`${minuteKey}:totalResponseTime`),
        this.redis.get(`${minuteKey}:errors`)
      ])

      const totalCount = parseInt(count || '0')
      const avgResponseTime = totalCount > 0 ? parseFloat(totalResponseTime || '0') / totalCount : 0
      const errorCount = parseInt(errors || '0')
      const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0

      return {
        timestamp: now.toISOString(),
        current: {
          requestsPerMinute: totalCount,
          averageResponseTime: avgResponseTime,
          errorRate,
          totalRequests: totalCount,
          totalErrors: errorCount
        },
        system: this.systemMetrics,
        thresholds: PERFORMANCE_THRESHOLDS
      }
    } catch (error) {
      console.error('Failed to get current performance:', error)
      return null
    }
  }

  /**
   * Get performance history for charts
   */
  async getPerformanceHistory(timeframe: string = '1h') {
    try {
      const timeframeMs = this.parseTimeframe(timeframe)
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - timeframeMs)
      
      const history: Array<{
        timestamp: string
        requests: number
        avgResponseTime: number
        errorRate: number
      }> = []

      // Generate time buckets
      const bucketSize = this.getBucketSize(timeframe)
      const bucketCount = Math.floor(timeframeMs / bucketSize)

      for (let i = 0; i < bucketCount; i++) {
        const bucketTime = new Date(startTime.getTime() + (i * bucketSize))
        const bucketKey = `performance:aggregates:minute:${bucketTime.toISOString().slice(0, 16)}`
        
        const [count, totalResponseTime, errors] = await Promise.all([
          this.redis.get(`${bucketKey}:count`),
          this.redis.get(`${bucketKey}:totalResponseTime`),
          this.redis.get(`${bucketKey}:errors`)
        ])

        const bucketCount = parseInt(count || '0')
        const bucketAvgResponseTime = bucketCount > 0 ? parseFloat(totalResponseTime || '0') / bucketCount : 0
        const bucketErrors = parseInt(errors || '0')
        const bucketErrorRate = bucketCount > 0 ? (bucketErrors / bucketCount) * 100 : 0

        history.push({
          timestamp: bucketTime.toISOString(),
          requests: bucketCount,
          avgResponseTime: bucketAvgResponseTime,
          errorRate: bucketErrorRate
        })
      }

      return {
        timeframe,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        data: history
      }
    } catch (error) {
      console.error('Failed to get performance history:', error)
      return null
    }
  }

  /**
   * Get top endpoints by performance
   */
  async getTopEndpoints(limit: number = 10) {
    try {
      const endpointKeys = await this.redis.keys('performance:endpoints:*')
      const endpoints: Array<{
        endpoint: string
        count: number
        avgResponseTime: number
        errorRate: number
        peakResponseTime: number
      }> = []

      for (const key of endpointKeys) {
        if (!key.includes(':count')) continue
        
        const endpoint = key.replace('performance:endpoints:', '').replace(':count', '')
        
        const [count, totalResponseTime, errors, peakResponseTime] = await Promise.all([
          this.redis.get(key),
          this.redis.hget(`performance:endpoints:${endpoint}`, 'totalResponseTime'),
          this.redis.hget(`performance:endpoints:${endpoint}`, 'errors'),
          this.redis.get(`performance:endpoints:${endpoint}:peakResponseTime`)
        ])

        const requestCount = parseInt(count || '0')
        const totalTime = parseFloat(totalResponseTime || '0')
        const errorCount = parseInt(errors || '0')
        const peak = parseFloat(peakResponseTime || '0')

        endpoints.push({
          endpoint,
          count: requestCount,
          avgResponseTime: requestCount > 0 ? totalTime / requestCount : 0,
          errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
          peakResponseTime: peak
        })
      }

      return endpoints
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get top endpoints:', error)
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

  private getBucketSize(timeframe: string): number {
    const timeframeMs = this.parseTimeframe(timeframe)
    
    if (timeframeMs <= 3600000) return 60000 // 1 minute
    if (timeframeMs <= 86400000) return 300000 // 5 minutes
    if (timeframeMs <= 604800000) return 3600000 // 1 hour
    return 86400000 // 1 day
  }

  /**
   * Get performance summary for status page
   */
  async getPerformanceSummary() {
    try {
      const current = await this.getCurrentPerformance()
      const history = await this.getPerformanceHistory('1h')
      const topEndpoints = await this.getTopEndpoints(5)

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        current: current?.current,
        system: this.systemMetrics,
        topEndpoints,
        uptime: this.systemMetrics.uptime,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get performance summary:', error)
      return null
    }
  }
}

export default new PerformanceMonitoringMiddleware()

// Export middleware function
export const {
  createPerformanceMiddleware
} = new PerformanceMonitoringMiddleware()

// Export the class for advanced usage
export { PerformanceMonitoringMiddleware }

// Export constants
export {
  PERFORMANCE_THRESHOLDS
}