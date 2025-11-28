import { EventEmitter } from 'events'
import { DataSource } from 'typeorm'
import RedisClient from '@shared/redis/RedisClient'
import { LoggerService } from './LoggerService'

export interface HealthCheckConfig {
  timeout: number
  interval: number
  retryAttempts: number
  dependencies: {
    database?: DataSource
    redis?: RedisClient
    externalServices?: ExternalServiceConfig[]
  }
  thresholds: {
    responseTime: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
}

export interface ExternalServiceConfig {
  name: string
  url: string
  timeout: number
  expectedStatus?: number[]
  headers?: Record<string, string>
  critical?: boolean
}

export interface HealthIndicator {
  name: string
  critical: boolean
  check(): Promise<HealthStatus>
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  message?: string
  details?: Record<string, any>
  timestamp: Date
}

export interface HealthCheckResult {
  overall: 'healthy' | 'unhealthy' | 'degraded'
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  uptime: number
  responseTime: number
  indicators: Record<string, HealthStatus>
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
  system: {
    memory: SystemMemoryInfo
    cpu: SystemCpuInfo
    process: ProcessInfo
  }
  dependencies: {
    database?: DependencyStatus
    redis?: DependencyStatus
    externalServices?: Record<string, DependencyStatus>
  }
}

export interface SystemMemoryInfo {
  used: number
  total: number
  percentage: number
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

export interface SystemCpuInfo {
  usage: number
  loadAverage: number[]
}

export interface ProcessInfo {
  pid: number
  uptime: number
  version: string
  platform: string
  arch: string
  nodeVersion: string
}

export interface DependencyStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  message?: string
  details?: any
}

// Custom Health Indicators
export abstract class BaseHealthIndicator implements HealthIndicator {
  abstract name: string
  abstract critical: boolean

  async check(): Promise<HealthStatus> {
    const startTime = Date.now()
    
    try {
      const result = await this.performCheck()
      const responseTime = Date.now() - startTime
      
      return {
        ...result,
        responseTime,
        timestamp: new Date()
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        status: 'unhealthy',
        responseTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error: error instanceof Error ? error.stack : String(error) },
        timestamp: new Date()
      }
    }
  }

  protected abstract performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>>
}

export class DatabaseHealthIndicator extends BaseHealthIndicator {
  name = 'database'
  critical = true

  constructor(private dataSource: DataSource) {
    super()
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    try {
      // Test connection
      await this.dataSource.query('SELECT 1')
      
      // Check connection pool
      const poolStats = this.dataSource.driver.master?.pool?.totalCount || 0
      const activeConnections = this.dataSource.driver.master?.pool?.totalCount || 0
      
      return {
        status: 'healthy',
        message: 'Database connection healthy',
        details: {
          type: 'postgresql',
          poolTotal: poolStats,
          activeConnections,
          database: this.dataSource.driver.database
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
}

export class RedisHealthIndicator extends BaseHealthIndicator {
  name = 'redis'
  critical = true

  constructor(private redis: RedisClient) {
    super()
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    try {
      const start = Date.now()
      const pingResult = await this.redis.ping()
      const responseTime = Date.now() - start
      
      if (pingResult === 'PONG') {
        const health = await this.redis.health()
        
        return {
          status: 'healthy',
          message: 'Redis connection healthy',
          details: {
            responseTime,
            connected: health.connected,
            latency: health.latency,
            memory: health.memory
          }
        }
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis ping failed',
          details: { response: pingResult }
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis connection failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
}

export class ExternalServiceHealthIndicator extends BaseHealthIndicator {
  name: string
  critical: boolean

  constructor(
    private config: ExternalServiceConfig,
    private logger: LoggerService
  ) {
    super()
    this.name = `external_${config.name}`
    this.critical = config.critical ?? true
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'e-Estoque-HealthCheck/1.0',
          ...this.config.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const expectedStatus = this.config.expectedStatus || [200, 201, 202]
      const isHealthy = expectedStatus.includes(response.status)

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy 
          ? `External service ${this.config.name} is healthy`
          : `External service ${this.config.name} returned status ${response.status}`,
        details: {
          url: this.config.url,
          statusCode: response.status,
          responseTime: response.headers.get('X-Response-Time') || 'unknown',
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `External service ${this.config.name} is unreachable`,
        details: {
          url: this.config.url,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
}

export class MemoryHealthIndicator extends BaseHealthIndicator {
  name = 'memory'
  critical = false

  constructor(private thresholds: { memoryUsage: number }) {
    super()
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    const memUsage = process.memoryUsage()
    const totalMem = memUsage.heapTotal + (process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
      ? parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] || '0') * 1024 * 1024 * 1024
      : 0)
    
    const usedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

    if (usedPercent > this.thresholds.memoryUsage) {
      return {
        status: 'degraded',
        message: `Memory usage is high: ${usedPercent.toFixed(2)}%`,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          usedPercentage: usedPercent
        }
      }
    }

    return {
      status: 'healthy',
      message: 'Memory usage is normal',
      details: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        usedPercentage: usedPercent
      }
    }
  }
}

export class CpuHealthIndicator extends BaseHealthIndicator {
  name = 'cpu'
  critical = false

  constructor(private thresholds: { cpuUsage: number }) {
    super()
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    const startUsage = process.cpuUsage()
    
    // Busy wait for 100ms
    const start = Date.now()
    while (Date.now() - start < 100) {
      Math.random() * Math.random()
    }
    
    const endUsage = process.cpuUsage(startUsage)
    const totalUsage = endUsage.user + endUsage.system
    const cpuPercent = (totalUsage / 100000) * 100 // Convert to percentage

    if (cpuPercent > this.thresholds.cpuUsage) {
      return {
        status: 'degraded',
        message: `CPU usage is high: ${cpuPercent.toFixed(2)}%`,
        details: {
          user: endUsage.user,
          system: endUsage.system,
          total: totalUsage,
          percentage: cpuPercent
        }
      }
    }

    return {
      status: 'healthy',
      message: 'CPU usage is normal',
      details: {
        user: endUsage.user,
        system: endUsage.system,
        total: totalUsage,
        percentage: cpuPercent
      }
    }
  }
}

export class DiskHealthIndicator extends BaseHealthIndicator {
  name = 'disk'
  critical = false

  constructor(private thresholds: { diskUsage: number }) {
    super()
  }

  protected async performCheck(): Promise<Omit<HealthStatus, 'responseTime' | 'timestamp'>> {
    try {
      const { promises: fs } = await import('fs')
      
      const stats = await fs.statfs('/')
      const total = stats.blocks * stats.bsize
      const free = stats.bavail * stats.bsize
      const used = total - free
      const usedPercent = (used / total) * 100

      if (usedPercent > this.thresholds.diskUsage) {
        return {
          status: 'degraded',
          message: `Disk usage is high: ${usedPercent.toFixed(2)}%`,
          details: {
            total,
            free,
            used,
            usedPercentage: usedPercent
          }
        }
      }

      return {
        status: 'healthy',
        message: 'Disk usage is normal',
        details: {
          total,
          free,
          used,
          usedPercentage: usedPercent
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to check disk usage',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
}

class HealthCheckService extends EventEmitter {
  private config: HealthCheckConfig
  private indicators: Map<string, HealthIndicator> = new Map()
  private lastResult: HealthCheckResult | null = null
  private logger: LoggerService
  private isRunning = false
  private checkInterval: NodeJS.Timeout | null = null

  constructor(config: HealthCheckConfig, logger: LoggerService) {
    super()
    this.config = {
      timeout: 5000,
      interval: 30000,
      retryAttempts: 3,
      thresholds: {
        responseTime: 1000,
        memoryUsage: 80,
        cpuUsage: 80,
        diskUsage: 85
      },
      ...config
    }
    
    this.logger = logger.createChildLogger({ component: 'health-check' })
    this.initializeDefaultIndicators()
  }

  private initializeDefaultIndicators(): void {
    // Add database indicator if configured
    if (this.config.dependencies.database) {
      this.addIndicator(new DatabaseHealthIndicator(this.config.dependencies.database))
    }

    // Add Redis indicator if configured
    if (this.config.dependencies.redis) {
      this.addIndicator(new RedisHealthIndicator(this.config.dependencies.redis))
    }

    // Add system resource indicators
    this.addIndicator(new MemoryHealthIndicator(this.config.thresholds))
    this.addIndicator(new CpuHealthIndicator(this.config.thresholds))
    this.addIndicator(new DiskHealthIndicator(this.config.thresholds))

    // Add external service indicators
    if (this.config.dependencies.externalServices) {
      for (const service of this.config.dependencies.externalServices) {
        this.addIndicator(new ExternalServiceHealthIndicator(service, this.logger))
      }
    }
  }

  addIndicator(indicator: HealthIndicator): void {
    this.indicators.set(indicator.name, indicator)
    this.logger.info(`Health indicator added: ${indicator.name}`, { 
      indicator: indicator.name, 
      critical: indicator.critical 
    })
  }

  removeIndicator(name: string): boolean {
    const removed = this.indicators.delete(name)
    if (removed) {
      this.logger.info(`Health indicator removed: ${name}`, { indicator: name })
    }
    return removed
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    this.logger.debug('Starting health check', { indicators: Array.from(this.indicators.keys()) })

    const indicators: Record<string, HealthStatus> = {}
    let healthyCount = 0
    let unhealthyCount = 0
    let degradedCount = 0

    // Run all health checks
    const checks = Array.from(this.indicators.entries()).map(async ([name, indicator]) => {
      try {
        const status = await indicator.check()
        indicators[name] = status
        
        if (status.status === 'healthy') {
          healthyCount++
        } else if (status.status === 'degraded') {
          degradedCount++
        } else {
          unhealthyCount++
        }
        
        this.logger.debug(`Health check completed: ${name}`, { 
          indicator: name, 
          status: status.status, 
          responseTime: status.responseTime 
        })
      } catch (error) {
        indicators[name] = {
          status: 'unhealthy',
          responseTime: 0,
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date()
        }
        unhealthyCount++
        
        this.logger.error(`Health check failed: ${name}`, error, { indicator: name })
      }
    })

    await Promise.all(checks)

    // Determine overall health
    const criticalUnhealthy = Array.from(this.indicators.values())
      .filter(indicator => indicator.critical && indicators[indicator.name]?.status === 'unhealthy')
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    
    if (criticalUnhealthy.length > 0) {
      overall = 'unhealthy'
    } else if (degradedCount > 0 || unhealthyCount > 0) {
      overall = 'degraded'
    }

    // System metrics
    const system = this.getSystemMetrics()
    
    // Dependency status
    const dependencies = await this.getDependencyStatus()

    const result: HealthCheckResult = {
      overall,
      status: overall,
      timestamp: new Date(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      indicators,
      summary: {
        total: this.indicators.size,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        degraded: degradedCount
      },
      system,
      dependencies
    }

    this.lastResult = result
    this.emit('healthCheck', result)

    // Log the result
    if (overall === 'healthy') {
      this.logger.debug('Health check completed: healthy', { responseTime: result.responseTime })
    } else {
      this.logger.warn(`Health check completed: ${overall}`, { 
        responseTime: result.responseTime,
        summary: result.summary 
      })
    }

    return result
  }

  private getSystemMetrics(): any {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        usage: cpuUsage.user + cpuUsage.system,
        loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0]
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    }
  }

  private async getDependencyStatus(): Promise<any> {
    const dependencies: any = {}

    // Database status
    if (this.config.dependencies.database) {
      try {
        await this.config.dependencies.database.query('SELECT 1')
        dependencies.database = {
          status: 'healthy',
          responseTime: 0,
          message: 'Connected'
        }
      } catch (error) {
        dependencies.database = {
          status: 'unhealthy',
          responseTime: 0,
          message: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }

    // Redis status
    if (this.config.dependencies.redis) {
      try {
        const health = await this.config.dependencies.redis.health()
        dependencies.redis = {
          status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
          responseTime: health.latency || 0,
          message: health.connected ? 'Connected' : 'Disconnected',
          details: health
        }
      } catch (error) {
        dependencies.redis = {
          status: 'unhealthy',
          responseTime: 0,
          message: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }

    // External services status
    if (this.config.dependencies.externalServices) {
      dependencies.externalServices = {}
      for (const service of this.config.dependencies.externalServices) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), service.timeout)
          
          const response = await fetch(service.url, {
            signal: controller.signal,
            headers: service.headers
          })
          
          clearTimeout(timeoutId)
          
          const expectedStatus = service.expectedStatus || [200, 201, 202]
          const isHealthy = expectedStatus.includes(response.status)
          
          dependencies.externalServices[service.name] = {
            status: isHealthy ? 'healthy' : 'degraded',
            responseTime: 0,
            message: isHealthy ? 'Available' : `Status ${response.status}`,
            details: { statusCode: response.status }
          }
        } catch (error) {
          dependencies.externalServices[service.name] = {
            status: 'unhealthy',
            responseTime: 0,
            message: error instanceof Error ? error.message : 'Unavailable'
          }
        }
      }
    }

    return dependencies
  }

  startMonitoring(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.logger.info('Starting health check monitoring', { 
      interval: this.config.interval,
      indicators: this.indicators.size 
    })

    // Perform initial check
    this.performHealthCheck().catch(error => {
      this.logger.error('Initial health check failed', error)
    })

    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        this.logger.error('Periodic health check failed', error)
      }
    }, this.config.interval)
  }

  stopMonitoring(): void {
    if (!this.isRunning || !this.checkInterval) {
      return
    }

    this.isRunning = false
    clearInterval(this.checkInterval)
    this.checkInterval = null
    
    this.logger.info('Health check monitoring stopped')
  }

  getLastResult(): HealthCheckResult | null {
    return this.lastResult
  }

  getIndicators(): HealthIndicator[] {
    return Array.from(this.indicators.values())
  }

  async isHealthy(): Promise<boolean> {
    const result = this.lastResult
    return result ? result.overall === 'healthy' : false
  }
}

export default HealthCheckService