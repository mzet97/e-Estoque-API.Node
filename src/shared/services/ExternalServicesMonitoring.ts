import { EventEmitter } from 'events'
import RedisClient from '@shared/redis/RedisClient'
import { LoggerService } from './LoggerService'

export interface ExternalServiceConfig {
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  timeout: number
  expectedStatusCodes: number[]
  expectedResponseTime: number
  critical: boolean
  retryAttempts: number
  retryDelay: number
  headers?: Record<string, string>
  body?: any
  certificateValidation?: boolean
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key'
    credentials?: {
      username?: string
      password?: string
      token?: string
      apiKey?: string
      headerName?: string
    }
  }
}

export interface ServiceHealthCheck {
  serviceName: string
  timestamp: Date
  status: 'healthy' | 'unhealthy' | 'degraded' | 'timeout'
  responseTime: number
  statusCode?: number
  error?: string
  details?: Record<string, any>
  consecutiveFailures: number
  lastSuccess?: Date
}

export interface ServiceMetrics {
  totalChecks: number
  healthyChecks: number
  unhealthyChecks: number
  timeoutChecks: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  uptime: number
  downtime: number
  availability: number
  lastCheck: Date
  lastSuccess?: Date
  lastFailure?: Date
}

export interface ServiceAlert {
  id: string
  serviceName: string
  type: 'down' | 'slow' | 'high_error_rate' | 'timeout'
  severity: 'warning' | 'critical'
  message: string
  threshold: number
  actual: number
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

class ExternalServicesMonitoring extends EventEmitter {
  private services: Map<string, ExternalServiceConfig> = new Map()
  private healthChecks: Map<string, ServiceHealthCheck> = new Map()
  private metrics: Map<string, ServiceMetrics> = new Map()
  private alertHistory: ServiceAlert[] = []
  private logger: LoggerService
  private redis?: RedisClient
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly DEFAULT_CHECK_INTERVAL = 60000 // 1 minute

  constructor(logger: LoggerService, redis?: RedisClient) {
    super()
    this.logger = logger.createChildLogger({ component: 'external-services-monitoring' })
    this.redis = redis
  }

  addService(config: ExternalServiceConfig): void {
    this.services.set(config.name, config)
    
    // Initialize metrics
    this.metrics.set(config.name, this.createEmptyMetrics())
    
    this.logger.info('External service added for monitoring', {
      service: config.name,
      url: config.url,
      critical: config.critical
    })

    this.emit('serviceAdded', config)
  }

  removeService(serviceName: string): boolean {
    const removed = this.services.delete(serviceName)
    if (removed) {
      this.healthChecks.delete(serviceName)
      this.metrics.delete(serviceName)
      
      this.logger.info('External service removed from monitoring', { service: serviceName })
      this.emit('serviceRemoved', serviceName)
    }
    return removed
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return
    }

    this.isMonitoring = true
    this.logger.info('Starting external services monitoring', {
      services: this.services.size,
      interval: this.DEFAULT_CHECK_INTERVAL
    })

    // Start monitoring all services
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllServices()
    }, this.DEFAULT_CHECK_INTERVAL)

    // Perform initial checks
    await this.checkAllServices()

    this.emit('monitoringStarted')
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring || !this.monitoringInterval) {
      return
    }

    this.isMonitoring = false
    clearInterval(this.monitoringInterval)
    this.monitoringInterval = null

    this.logger.info('External services monitoring stopped')
    this.emit('monitoringStopped')
  }

  private async checkAllServices(): Promise<void> {
    const checkPromises = Array.from(this.services.entries()).map(async ([serviceName, config]) => {
      try {
        await this.checkService(serviceName, config)
      } catch (error) {
        this.logger.error(`Failed to check service ${serviceName}`, error)
      }
    })

    await Promise.allSettled(checkPromises)
  }

  async checkService(serviceName: string, config?: ExternalServiceConfig): Promise<ServiceHealthCheck> {
    const serviceConfig = config || this.services.get(serviceName)
    if (!serviceConfig) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const startTime = Date.now()
    let healthCheck: ServiceHealthCheck

    try {
      healthCheck = await this.performHealthCheck(serviceName, serviceConfig, startTime)
    } catch (error) {
      healthCheck = this.createErrorHealthCheck(serviceName, serviceConfig, error as Error, startTime)
    }

    // Store the health check result
    this.healthChecks.set(serviceName, healthCheck)
    
    // Update metrics
    await this.updateMetrics(serviceName, healthCheck)
    
    // Check for alerts
    await this.checkAlerts(serviceName, healthCheck)
    
    // Store in Redis for persistence
    if (this.redis) {
      await this.storeHealthCheckInRedis(serviceName, healthCheck)
    }

    // Emit events
    this.emit('healthCheck', healthCheck)
    
    if (healthCheck.status === 'unhealthy') {
      this.emit('serviceUnhealthy', healthCheck)
      this.logger.warn(`Service ${serviceName} is unhealthy`, healthCheck)
    } else if (healthCheck.status === 'healthy') {
      this.emit('serviceHealthy', healthCheck)
    }

    return healthCheck
  }

  private async performHealthCheck(
    serviceName: string, 
    config: ExternalServiceConfig, 
    startTime: number
  ): Promise<ServiceHealthCheck> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      // Prepare request
      const requestInit: RequestInit = {
        method: config.method,
        headers: {
          'User-Agent': 'e-Estoque-ExternalMonitor/1.0',
          'Accept': 'application/json, text/plain, */*',
          ...config.headers
        },
        signal: controller.signal,
        ...(config.certificateValidation === false && {
          agent: new (require('agentkeepalive').HttpsAgent)({ rejectUnauthorized: false })
        })
      }

      // Add authentication
      if (config.authentication && config.authentication.type !== 'none') {
        this.addAuthenticationHeaders(requestInit, config.authentication)
      }

      // Add body for non-GET requests
      if (config.method !== 'GET' && config.body) {
        requestInit.body = JSON.stringify(config.body)
        requestInit.headers = {
          ...requestInit.headers,
          'Content-Type': 'application/json'
        }
      }

      // Make the request
      const response = await fetch(config.url, requestInit)
      const responseTime = Date.now() - startTime

      clearTimeout(timeoutId)

      // Check status code
      const isHealthy = config.expectedStatusCodes.includes(response.status)
      const status = isHealthy ? 'healthy' : 'degraded'

      // Extract response details
      const details: Record<string, any> = {
        statusCode: response.status,
        responseTime,
        url: config.url,
        method: config.method
      }

      // Add response headers
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase().startsWith('x-') || key.toLowerCase() === 'content-type') {
          details[key] = value
        }
      }

      return {
        serviceName,
        timestamp: new Date(),
        status,
        responseTime,
        statusCode: response.status,
        details,
        consecutiveFailures: 0,
        lastSuccess: new Date()
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private addAuthenticationHeaders(requestInit: RequestInit, auth: ExternalServiceConfig['authentication']): void {
    if (!auth || !auth.credentials) return

    switch (auth.type) {
      case 'basic':
        if (auth.credentials.username && auth.credentials.password) {
          const credentials = Buffer.from(`${auth.credentials.username}:${auth.credentials.password}`).toString('base64')
          requestInit.headers = {
            ...requestInit.headers,
            'Authorization': `Basic ${credentials}`
          }
        }
        break
        
      case 'bearer':
        if (auth.credentials.token) {
          requestInit.headers = {
            ...requestInit.headers,
            'Authorization': `Bearer ${auth.credentials.token}`
          }
        }
        break
        
      case 'api-key':
        const headerName = auth.credentials.headerName || 'X-API-Key'
        if (auth.credentials.apiKey) {
          requestInit.headers = {
            ...requestInit.headers,
            [headerName]: auth.credentials.apiKey
          }
        }
        break
    }
  }

  private createErrorHealthCheck(
    serviceName: string,
    config: ExternalServiceConfig,
    error: Error,
    startTime: number
  ): ServiceHealthCheck {
    const responseTime = Date.now() - startTime
    
    let status: ServiceHealthCheck['status'] = 'unhealthy'
    let errorMessage = error.message

    // Determine error type
    if (error.name === 'AbortError' || responseTime >= config.timeout) {
      status = 'timeout'
      errorMessage = 'Request timeout'
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Connection failed'
    }

    return {
      serviceName,
      timestamp: new Date(),
      status,
      responseTime,
      error: errorMessage,
      consecutiveFailures: 1,
      details: {
        url: config.url,
        method: config.method,
        timeout: config.timeout,
        error: error.stack || error.message
      }
    }
  }

  private async updateMetrics(serviceName: string, healthCheck: ServiceHealthCheck): Promise<void> {
    const currentMetrics = this.metrics.get(serviceName) || this.createEmptyMetrics()

    // Update basic counters
    currentMetrics.totalChecks++
    
    if (healthCheck.status === 'healthy') {
      currentMetrics.healthyChecks++
      currentMetrics.lastSuccess = healthCheck.timestamp
    } else {
      currentMetrics.unhealthyChecks++
      currentMetrics.lastFailure = healthCheck.timestamp
      currentMetrics.consecutiveFailures = healthCheck.consecutiveFailures
    }

    if (healthCheck.status === 'timeout') {
      currentMetrics.timeoutChecks++
    }

    // Update response time metrics
    if (healthCheck.responseTime > 0) {
      currentMetrics.minResponseTime = Math.min(currentMetrics.minResponseTime, healthCheck.responseTime)
      currentMetrics.maxResponseTime = Math.max(currentMetrics.maxResponseTime, healthCheck.responseTime)
      currentMetrics.averageResponseTime = (
        (currentMetrics.averageResponseTime * (currentMetrics.totalChecks - 1) + healthCheck.responseTime) /
        currentMetrics.totalChecks
      )
    }

    // Update uptime/downtime
    const service = this.services.get(serviceName)
    if (service && currentMetrics.lastSuccess && currentMetrics.lastFailure) {
      const timeDiff = healthCheck.timestamp.getTime() - currentMetrics.lastSuccess.getTime()
      
      if (healthCheck.status === 'healthy') {
        currentMetrics.uptime += timeDiff
      } else {
        currentMetrics.downtime += timeDiff
      }
      
      const totalTime = currentMetrics.uptime + currentMetrics.downtime
      currentMetrics.availability = totalTime > 0 ? (currentMetrics.uptime / totalTime) * 100 : 0
    }

    currentMetrics.lastCheck = healthCheck.timestamp

    this.metrics.set(serviceName, currentMetrics)
  }

  private async checkAlerts(serviceName: string, healthCheck: ServiceHealthCheck): Promise<void> {
    const service = this.services.get(serviceName)
    if (!service) return

    const alerts: ServiceAlert[] = []

    // Service down alert
    if (healthCheck.status === 'unhealthy' || healthCheck.status === 'timeout') {
      alerts.push({
        id: this.generateAlertId(),
        serviceName,
        type: healthCheck.status === 'timeout' ? 'timeout' : 'down',
        severity: service.critical ? 'critical' : 'warning',
        message: `${serviceName} is ${healthCheck.status}: ${healthCheck.error || 'Unknown error'}`,
        threshold: 1,
        actual: 1,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Slow response alert
    if (healthCheck.responseTime > service.expectedResponseTime) {
      alerts.push({
        id: this.generateAlertId(),
        serviceName,
        type: 'slow',
        severity: healthCheck.responseTime > service.expectedResponseTime * 2 ? 'critical' : 'warning',
        message: `${serviceName} response time is slow: ${healthCheck.responseTime}ms`,
        threshold: service.expectedResponseTime,
        actual: healthCheck.responseTime,
        timestamp: new Date(),
        resolved: false
      })
    }

    // High error rate alert (consecutive failures)
    if (healthCheck.consecutiveFailures >= 3) {
      alerts.push({
        id: this.generateAlertId(),
        serviceName,
        type: 'high_error_rate',
        severity: 'warning',
        message: `${serviceName} has high error rate: ${healthCheck.consecutiveFailures} consecutive failures`,
        threshold: 3,
        actual: healthCheck.consecutiveFailures,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Emit alerts
    for (const alert of alerts) {
      this.alertHistory.push(alert)
      this.emit('alert', alert)
      this.logger.warn('External service alert', alert)
    }
  }

  private createEmptyMetrics(): ServiceMetrics {
    return {
      totalChecks: 0,
      healthyChecks: 0,
      unhealthyChecks: 0,
      timeoutChecks: 0,
      averageResponseTime: 0,
      minResponseTime: Number.MAX_SAFE_INTEGER,
      maxResponseTime: 0,
      uptime: 0,
      downtime: 0,
      availability: 0,
      lastCheck: new Date()
    }
  }

  private generateAlertId(): string {
    return `ext_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async storeHealthCheckInRedis(serviceName: string, healthCheck: ServiceHealthCheck): Promise<void> {
    try {
      const key = `service:health:${serviceName}:${healthCheck.timestamp.getTime()}`
      await this.redis.setex(key, 3600, JSON.stringify(healthCheck)) // 1 hour retention
    } catch (error) {
      this.logger.warn('Failed to store health check in Redis', { error, serviceName })
    }
  }

  // Public getters
  getServiceHealth(serviceName: string): ServiceHealthCheck | null {
    return this.healthChecks.get(serviceName) || null
  }

  getAllServicesHealth(): Record<string, ServiceHealthCheck> {
    const result: Record<string, ServiceHealthCheck> = {}
    for (const [serviceName, healthCheck] of this.healthChecks) {
      result[serviceName] = healthCheck
    }
    return result
  }

  getServiceMetrics(serviceName: string): ServiceMetrics | null {
    return this.metrics.get(serviceName) || null
  }

  getAllServicesMetrics(): Record<string, ServiceMetrics> {
    const result: Record<string, ServiceMetrics> = {}
    for (const [serviceName, metrics] of this.metrics) {
      result[serviceName] = metrics
    }
    return result
  }

  getServicesList(): ExternalServiceConfig[] {
    return Array.from(this.services.values())
  }

  getActiveAlerts(): ServiceAlert[] {
    return this.alertHistory.filter(alert => !alert.resolved)
  }

  getAlertHistory(limit?: number): ServiceAlert[] {
    const alerts = [...this.alertHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? alerts.slice(0, limit) : alerts
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      this.emit('alertResolved', alert)
      this.logger.info('External service alert resolved', { alertId, serviceName: alert.serviceName })
      return true
    }
    return false
  }

  // Manual check
  async checkServiceNow(serviceName: string): Promise<ServiceHealthCheck> {
    const config = this.services.get(serviceName)
    if (!config) {
      throw new Error(`Service ${serviceName} not found`)
    }

    this.logger.info(`Manual health check requested for ${serviceName}`)
    return await this.checkService(serviceName, config)
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Basic health check - ensure we can perform monitoring
      const services = this.getServicesList()
      return services.length >= 0 && this.isMonitoring === true
    } catch (error) {
      return false
    }
  }
}

export default ExternalServicesMonitoring