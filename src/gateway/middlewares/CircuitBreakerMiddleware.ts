import { Request, Response, NextFunction } from 'express'
import { CircuitBreakerOptions, CircuitBreaker } from 'opossum'
import { redis } from '@shared/redis/RedisClient'

// Service health check endpoints
const SERVICE_HEALTH_CHECKS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/health',
  companies: process.env.COMPANIES_SERVICE_URL || 'http://localhost:3002/health',
  customers: process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3003/health',
  sales: process.env.SALES_SERVICE_URL || 'http://localhost:3004/health',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3005/health'
}

interface ServiceConfig {
  name: string
  url: string
  timeout: number
  errorThresholdPercentage: number
  resetTimeout: number
  rollingCountTimeout: number
  rollingCountBuckets: number
  fallback?: (req: Request, res: Response) => void
}

class CircuitBreakerMiddleware {
  private breakers: Map<string, CircuitBreaker> = new Map()
  private services: Map<string, ServiceConfig> = new Map()

  constructor() {
    this.initializeServices()
    this.initializeBreakers()
    this.startHealthCheckMonitoring()
  }

  private initializeServices() {
    // Auth Service Configuration
    this.services.set('auth', {
      name: 'auth',
      url: SERVICE_HEALTH_CHECKS.auth,
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      fallback: this.createAuthFallback()
    })

    // Companies Service Configuration
    this.services.set('companies', {
      name: 'companies',
      url: SERVICE_HEALTH_CHECKS.companies,
      timeout: 3000,
      errorThresholdPercentage: 30,
      resetTimeout: 60000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    })

    // Customers Service Configuration
    this.services.set('customers', {
      name: 'customers',
      url: SERVICE_HEALTH_CHECKS.customers,
      timeout: 3000,
      errorThresholdPercentage: 30,
      resetTimeout: 60000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    })

    // Sales Service Configuration
    this.services.set('sales', {
      name: 'sales',
      url: SERVICE_HEALTH_CHECKS.sales,
      timeout: 3000,
      errorThresholdPercentage: 30,
      resetTimeout: 60000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    })

    // Inventory Service Configuration
    this.services.set('inventory', {
      name: 'inventory',
      url: SERVICE_HEALTH_CHECKS.inventory,
      timeout: 3000,
      errorThresholdPercentage: 30,
      resetTimeout: 60000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    })
  }

  private initializeBreakers() {
    this.services.forEach((config, serviceName) => {
      const breakerOptions: CircuitBreakerOptions = {
        timeout: config.timeout,
        errorThresholdPercentage: config.errorThresholdPercentage,
        resetTimeout: config.resetTimeout,
        rollingCountTimeout: config.rollingCountTimeout,
        rollingCountBuckets: config.rollingCountBuckets,
        volumeThreshold: 5, // Minimum requests before considering circuit state
        errorFilter: this.createErrorFilter(serviceName)
      }

      const breaker = new CircuitBreaker(
        this.createServiceCaller(serviceName),
        breakerOptions
      )

      // Event handlers for monitoring
      breaker.on('open', () => {
        console.warn(`Circuit breaker OPEN for service: ${serviceName}`)
        this.updateServiceStatus(serviceName, 'unhealthy')
      })

      breaker.on('halfOpen', () => {
        console.info(`Circuit breaker HALF-OPEN for service: ${serviceName}`)
        this.updateServiceStatus(serviceName, 'half-open')
      })

      breaker.on('close', () => {
        console.info(`Circuit breaker CLOSED for service: ${serviceName}`)
        this.updateServiceStatus(serviceName, 'healthy')
      })

      breaker.on('reject', (error) => {
        console.error(`Circuit breaker REJECTED for service: ${serviceName}`, error)
      })

      this.breakers.set(serviceName, breaker)
    })
  }

  private createServiceCaller(serviceName: string) {
    return async (url: string, options?: any) => {
      const fetch = (await import('node-fetch')).default
      
      try {
        const response = await fetch(url, {
          timeout: this.services.get(serviceName)?.timeout || 5000,
          ...options
        })

        if (!response.ok) {
          throw new Error(`Service ${serviceName} returned ${response.status}`)
        }

        return response
      } catch (error) {
        console.error(`Error calling service ${serviceName}:`, error)
        throw error
      }
    }
  }

  private createErrorFilter(serviceName: string) {
    return (error: any) => {
      // Don't count certain errors as service failures
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return false // Don't count as failure (network issues)
      }

      // Don't count timeout errors for services that take longer
      if (error.code === 'ETIMEDOUT' && ['sales', 'inventory'].includes(serviceName)) {
        return false
      }

      // Count all other errors as service failures
      return true
    }
  }

  private createAuthFallback() {
    return (req: Request, res: Response) => {
      // Fallback response for authentication service
      res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE',
        fallback: true,
        service: 'auth'
      })
    }
  }

  private startHealthCheckMonitoring() {
    // Check service health every 30 seconds
    setInterval(async () => {
      for (const [serviceName, config] of this.services.entries()) {
        try {
          const isHealthy = await this.checkServiceHealth(config.url)
          
          // If service is unhealthy and breaker is closed, trigger circuit breaker
          if (!isHealthy && this.breakers.get(serviceName)?.status === 'CLOSED') {
            console.warn(`Service ${serviceName} is unhealthy, circuit breaker will be triggered`)
          }
          
          // Update service status in Redis for monitoring
          await this.updateServiceHealthStatus(serviceName, isHealthy)
          
        } catch (error) {
          console.error(`Health check failed for service ${serviceName}:`, error)
        }
      }
    }, 30000)
  }

  private async checkServiceHealth(url: string): Promise<boolean> {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      })
      
      return response.ok && response.status === 200
    } catch (error) {
      return false
    }
  }

  private async updateServiceHealthStatus(serviceName: string, isHealthy: boolean) {
    try {
      const key = `service:health:${serviceName}`
      await redis.setex(key, 300, isHealthy ? 'healthy' : 'unhealthy')
    } catch (error) {
      console.error('Failed to update service health status:', error)
    }
  }

  private updateServiceStatus(serviceName: string, status: 'healthy' | 'unhealthy' | 'half-open') {
    try {
      const key = `service:status:${serviceName}`
      redis.setex(key, 300, status)
    } catch (error) {
      console.error('Failed to update service status:', error)
    }
  }

  /**
   * Create circuit breaker middleware for specific service
   */
  createServiceBreaker(serviceName: string) {
    const breaker = this.breakers.get(serviceName)
    const config = this.services.get(serviceName)

    if (!breaker || !config) {
      throw new Error(`Circuit breaker not configured for service: ${serviceName}`)
    }

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if service is currently available
        const serviceStatus = await this.getServiceStatus(serviceName)
        
        if (serviceStatus === 'unhealthy') {
          // Service is down, use fallback if available
          if (config.fallback) {
            console.warn(`Service ${serviceName} is down, using fallback`)
            config.fallback(req, res)
            return
          }

          res.status(503).json({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message: `Service ${serviceName} is temporarily unavailable`,
            code: 'SERVICE_UNAVAILABLE',
            service: serviceName
          })
          return
        }

        // Add service info to request for downstream middleware
        ;(req as any).serviceInfo = {
          name: serviceName,
          breaker: breaker.status,
          lastCheck: new Date()
        }

        next()
      } catch (error) {
        console.error(`Error in circuit breaker middleware for ${serviceName}:`, error)
        
        res.status(503).json({
          success: false,
          error: 'CIRCUIT_BREAKER_ERROR',
          message: 'Circuit breaker error',
          code: 'CIRCUIT_BREAKER_ERROR',
          service: serviceName
        })
      }
    }
  }

  /**
   * Get current status of all services
   */
  async getAllServicesStatus() {
    const status: Record<string, any> = {}

    for (const [serviceName, breaker] of this.breakers.entries()) {
      const healthKey = `service:health:${serviceName}`
      const statusKey = `service:status:${serviceName}`
      
      const [health, circuitStatus] = await Promise.all([
        redis.get(healthKey),
        redis.get(statusKey)
      ])

      status[serviceName] = {
        circuitBreaker: breaker.status,
        health: health || 'unknown',
        circuit: circuitStatus || 'unknown',
        statistics: {
          failures: breaker.stats.failures,
          successes: breaker.stats.successes,
          rejects: breaker.stats.rejects,
          timeouts: breaker.stats.timeouts,
          fallback: breaker.stats.fallback
        }
      }
    }

    return status
  }

  /**
   * Get status of specific service
   */
  async getServiceStatus(serviceName: string) {
    const key = `service:health:${serviceName}`
    const status = await redis.get(key)
    return status === 'healthy'
  }

  /**
   * Reset circuit breaker for specific service (admin only)
   */
  async resetCircuitBreaker(serviceName: string) {
    const breaker = this.breakers.get(serviceName)
    if (!breaker) {
      throw new Error(`Circuit breaker not found for service: ${serviceName}`)
    }

    // Reset the circuit breaker
    breaker.reset()
    
    console.info(`Circuit breaker reset for service: ${serviceName}`)
    
    // Update status
    await this.updateServiceStatus(serviceName, 'healthy')
    
    return { success: true, message: `Circuit breaker reset for ${serviceName}` }
  }

  /**
   * Bulk health check for monitoring dashboard
   */
  async performBulkHealthCheck() {
    const results: Record<string, any> = {}

    for (const [serviceName, config] of this.services.entries()) {
      const breaker = this.breakers.get(serviceName)!
      
      try {
        const isHealthy = await this.checkServiceHealth(config.url)
        
        results[serviceName] = {
          url: config.url,
          status: isHealthy ? 'up' : 'down',
          circuitBreaker: breaker.status,
          responseTime: await this.measureResponseTime(config.url),
          lastCheck: new Date().toISOString()
        }
      } catch (error) {
        results[serviceName] = {
          url: config.url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          circuitBreaker: breaker.status,
          lastCheck: new Date().toISOString()
        }
      }
    }

    return results
  }

  private async measureResponseTime(url: string): Promise<number> {
    try {
      const start = Date.now()
      const fetch = (await import('node-fetch')).default
      await fetch(url, { timeout: 5000 })
      return Date.now() - start
    } catch (error) {
      return -1
    }
  }
}

export default new CircuitBreakerMiddleware()

// Export middleware functions
export const {
  createServiceBreaker,
  getAllServicesStatus,
  getServiceStatus,
  resetCircuitBreaker,
  performBulkHealthCheck
} = new CircuitBreakerMiddleware()