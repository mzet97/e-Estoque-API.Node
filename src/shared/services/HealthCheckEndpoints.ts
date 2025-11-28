import { Router, Request, Response } from 'express'
import { HealthCheckService, HealthCheckResult } from './HealthCheckService'
import { MetricsService } from './MetricsService'
import { LoggerService } from './LoggerService'

export interface HealthCheckEndpointsConfig {
  enableDetailedHealth: boolean
  enableMetrics: boolean
  enableReadiness: boolean
  enableLiveness: boolean
  customEndpoints: {
    path: string
    handler: (req: Request, res: Response) => Promise<any>
  }[]
}

class HealthCheckEndpoints {
  private router: Router
  private healthService: HealthCheckService
  private metricsService: MetricsService
  private logger: LoggerService
  private config: HealthCheckEndpointsConfig

  constructor(
    healthService: HealthCheckService,
    metricsService: MetricsService,
    logger: LoggerService,
    config: HealthCheckEndpointsConfig
  ) {
    this.healthService = healthService
    this.metricsService = metricsService
    this.logger = logger.createChildLogger({ component: 'health-endpoints' })
    this.config = {
      enableDetailedHealth: true,
      enableMetrics: true,
      enableReadiness: true,
      enableLiveness: true,
      customEndpoints: [],
      ...config
    }
    
    this.router = Router()
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Basic health endpoint
    this.router.get('/health', async (req: Request, res: Response) => {
      try {
        const isHealthy = await this.healthService.isHealthy()
        const status = isHealthy ? 200 : 503
        
        res.status(status).json({
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          service: process.env.SERVICE_NAME || 'e-estoque-api',
          version: process.env.SERVICE_VERSION || '1.0.0',
          uptime: process.uptime()
        })
      } catch (error) {
        this.logger.error('Health endpoint error', error)
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        })
      }
    })

    // Detailed health endpoint
    if (this.config.enableDetailedHealth) {
      this.router.get('/health/detailed', async (req: Request, res: Response) => {
        try {
          const result = await this.healthService.performHealthCheck()
          
          const statusCode = result.overall === 'healthy' ? 200 
            : result.overall === 'degraded' ? 200 
            : 503

          res.status(statusCode).json(result)
        } catch (error) {
          this.logger.error('Detailed health endpoint error', error)
          res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed'
          })
        }
      })
    }

    // Readiness probe
    if (this.config.enableReadiness) {
      this.router.get('/health/ready', async (req: Request, res: Response) => {
        try {
          const result = await this.healthService.performHealthCheck()
          
          // Check only critical dependencies
          const criticalHealthy = Array.from(this.healthService.getIndicators())
            .filter(indicator => indicator.critical)
            .every(indicator => result.indicators[indicator.name]?.status === 'healthy')
          
          const status = criticalHealthy ? 200 : 503
          const statusText = criticalHealthy ? 'ready' : 'not ready'

          res.status(status).json({
            status: statusText,
            timestamp: new Date().toISOString(),
            criticalDependencies: this.getCriticalDependenciesStatus(result)
          })
        } catch (error) {
          this.logger.error('Readiness probe error', error)
          res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed'
          })
        }
      })
    }

    // Liveness probe
    if (this.config.enableLiveness) {
      this.router.get('/health/live', async (req: Request, res: Response) => {
        try {
          // Simple liveness check - just ensure the service is responding
          res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid
          })
        } catch (error) {
          this.logger.error('Liveness probe error', error)
          res.status(503).json({
            status: 'dead',
            timestamp: new Date().toISOString(),
            error: 'Liveness check failed'
          })
        }
      })
    }

    // Metrics endpoint
    if (this.config.enableMetrics) {
      this.router.get('/metrics', async (req: Request, res: Response) => {
        try {
          const metrics = await this.metricsService.getMetrics()
          res.set('Content-Type', 'text/plain')
          res.status(200).send(metrics)
        } catch (error) {
          this.logger.error('Metrics endpoint error', error)
          res.status(503).json({
            error: 'Metrics collection failed'
          })
        }
      })

      this.router.get('/metrics/json', async (req: Request, res: Response) => {
        try {
          const metrics = await this.metricsService.getMetricsJSON()
          res.status(200).json(metrics)
        } catch (error) {
          this.logger.error('Metrics JSON endpoint error', error)
          res.status(503).json({
            error: 'Metrics collection failed'
          })
        }
      })
    }

    // Custom endpoints
    this.config.customEndpoints.forEach(({ path, handler }) => {
      this.router.get(path, handler)
    })

    // Fallback for unknown health endpoints
    this.router.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Health endpoint not found',
        availableEndpoints: this.getAvailableEndpoints(),
        timestamp: new Date().toISOString()
      })
    })
  }

  private getCriticalDependenciesStatus(result: HealthCheckResult): Record<string, string> {
    const criticalStatus: Record<string, string> = {}
    
    const indicators = this.healthService.getIndicators()
    for (const indicator of indicators) {
      if (indicator.critical) {
        criticalStatus[indicator.name] = result.indicators[indicator.name]?.status || 'unknown'
      }
    }

    return criticalStatus
  }

  private getAvailableEndpoints(): string[] {
    const endpoints = ['/health']
    
    if (this.config.enableDetailedHealth) {
      endpoints.push('/health/detailed')
    }
    
    if (this.config.enableReadiness) {
      endpoints.push('/health/ready')
    }
    
    if (this.config.enableLiveness) {
      endpoints.push('/health/live')
    }
    
    if (this.config.enableMetrics) {
      endpoints.push('/metrics', '/metrics/json')
    }

    this.config.customEndpoints.forEach(({ path }) => {
      endpoints.push(path)
    })

    return endpoints
  }

  getRouter(): Router {
    return this.router
  }

  // Helper methods for use cases to update health status
  async markServiceHealthy(serviceName: string, message?: string): Promise<void> {
    this.healthService.addIndicator({
      name: serviceName,
      critical: true,
      check: async () => ({
        status: 'healthy',
        responseTime: 0,
        message: message || `${serviceName} is healthy`,
        timestamp: new Date()
      })
    })
  }

  async markServiceUnhealthy(serviceName: string, error: Error): Promise<void> {
    this.healthService.addIndicator({
      name: serviceName,
      critical: true,
      check: async () => ({
        status: 'unhealthy',
        responseTime: 0,
        message: `${serviceName} is unhealthy: ${error.message}`,
        details: { error: error.message, stack: error.stack },
        timestamp: new Date()
      })
    })
  }

  async updateServiceStatus(serviceName: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any): Promise<void> {
    this.healthService.addIndicator({
      name: serviceName,
      critical: true,
      check: async () => ({
        status,
        responseTime: 0,
        message: `${serviceName} is ${status}`,
        details,
        timestamp: new Date()
      })
    })
  }
}

export default HealthCheckEndpoints