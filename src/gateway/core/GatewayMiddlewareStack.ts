import { Request, Response, NextFunction, Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { RateLimitMiddleware } from '../middlewares/RateLimitMiddleware'
import { CircuitBreakerMiddleware } from '../middlewares/CircuitBreakerMiddleware'
import { RequestLoggingMiddleware } from '../middlewares/RequestLoggingMiddleware'
import { ApiVersioningMiddleware } from '../middlewares/ApiVersioningMiddleware'
import { PerformanceMonitoringMiddleware } from '../middlewares/PerformanceMonitoringMiddleware'
import { LoadBalancingMiddleware } from '../middlewares/LoadBalancingMiddleware'

interface GatewayConfig {
  port: number
  host: string
  cors: {
    origin: string | string[]
    credentials: boolean
  }
  rateLimit: {
    windowMs: number
    max: number
    message: string
  }
  security: {
    helmet: boolean
    cors: boolean
    compression: boolean
  }
  services: {
    [serviceName: string]: {
      baseUrl: string
      circuitBreaker: boolean
      rateLimit: boolean
      loadBalancing: boolean
    }
  }
}

class GatewayMiddlewareStack {
  private config: GatewayConfig

  constructor(config?: Partial<GatewayConfig>) {
    this.config = {
      port: config?.port || 3000,
      host: config?.host || 'localhost',
      cors: config?.cors || {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      },
      rateLimit: config?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
      },
      security: config?.security || {
        helmet: true,
        cors: true
      },
      services: config?.services || {
        auth: { baseUrl: 'http://localhost:3001', circuitBreaker: true, rateLimit: true, loadBalancing: true },
        companies: { baseUrl: 'http://localhost:3002', circuitBreaker: true, rateLimit: true, loadBalancing: true },
        customers: { baseUrl: 'http://localhost:3003', circuitBreaker: true, rateLimit: true, loadBalancing: true },
        sales: { baseUrl: 'http://localhost:3004', circuitBreaker: true, rateLimit: true, loadBalancing: true },
        inventory: { baseUrl: 'http://localhost:3005', circuitBreaker: true, rateLimit: true, loadBalancing: true }
      }
    }
  }

  /**
   * Configure the main middleware stack for the Express application
   */
  configureMiddleware(app: Express) {
    console.log('Configuring API Gateway middleware stack...')

    // 1. Security Middleware
    this.configureSecurityMiddleware(app)

    // 2. Request Logging
    this.configureLoggingMiddleware(app)

    // 3. Performance Monitoring
    this.configurePerformanceMiddleware(app)

    // 4. API Versioning
    this.configureVersioningMiddleware(app)

    // 5. Rate Limiting
    this.configureRateLimitMiddleware(app)

    // 6. Circuit Breaker
    this.configureCircuitBreakerMiddleware(app)

    // 7. Load Balancing
    this.configureLoadBalancingMiddleware(app)

    // 8. Service Proxy
    this.configureServiceProxy(app)

    // 9. Health Check
    this.configureHealthCheck(app)

    // 10. Admin Endpoints
    this.configureAdminEndpoints(app)

    // 11. Error Handling
    this.configureErrorHandling(app)

    console.log('API Gateway middleware stack configured successfully')
  }

  private configureSecurityMiddleware(app: Express) {
    if (this.config.security.helmet) {
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      }))
      console.log('✅ Helmet security middleware configured')
    }

    if (this.config.security.cors) {
      app.use(cors(this.config.cors))
      console.log('✅ CORS middleware configured')
    }

    // Custom security headers
    app.use((req, res, next) => {
      res.setHeader('X-API-Gateway', 'e-Estoque API Gateway v1.0.0')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      next()
    })
  }

  private configureLoggingMiddleware(app: Express) {
    app.use(RequestLoggingMiddleware.createRequestLogger())
    app.use(RequestLoggingMiddleware.createErrorLogger())
    console.log('✅ Request logging middleware configured')
  }

  private configurePerformanceMiddleware(app: Express) {
    app.use(PerformanceMonitoringMiddleware.createPerformanceMiddleware())
    console.log('✅ Performance monitoring middleware configured')
  }

  private configureVersioningMiddleware(app: Express) {
    app.use(ApiVersioningMiddleware.createVersioningMiddleware())
    console.log('✅ API versioning middleware configured')
  }

  private configureRateLimitMiddleware(app: Express) {
    // Global rate limiting
    app.use(rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: this.config.rateLimit.message,
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        RequestLoggingMiddleware.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, req)

        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: this.config.rateLimit.message,
          code: 'RATE_LIMIT_EXCEEDED'
        })
      }
    }))

    // Custom rate limiters for different user tiers
    app.use(RateLimitMiddleware.createTierBasedLimiter())
    
    // Strict rate limiting for sensitive endpoints
    app.use(/^\/api\/v[0-9]+\/(auth|admin)/, 
      RateLimitMiddleware.createStrictLimiter(10, 60000, 300000) // 10 requests per minute, 5 min block
    )

    console.log('✅ Rate limiting middleware configured')
  }

  private configureCircuitBreakerMiddleware(app: Express) {
    // Add circuit breaker middleware for all service endpoints
    app.use(/^\/api\/v[0-9]+\/(auth|companies|customers|sales|inventory)/, (req, res, next) => {
      const serviceName = this.extractServiceName(req.path)
      if (serviceName) {
        const circuitBreaker = CircuitBreakerMiddleware.createServiceBreaker(serviceName)
        circuitBreaker(req, res, next)
      } else {
        next()
      }
    })

    console.log('✅ Circuit breaker middleware configured')
  }

  private configureLoadBalancingMiddleware(app: Express) {
    app.use(LoadBalancingMiddleware.createLoadBalancingMiddleware())
    console.log('✅ Load balancing middleware configured')
  }

  private configureServiceProxy(app: Express) {
    // Proxy middleware to forward requests to backend services
    app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const serviceName = this.extractServiceName(req.path)
        const targetInstance = (req as any).targetInstance
        
        if (!serviceName || !targetInstance) {
          return next() // Not a service route or no target instance
        }

        // Build target URL
        const targetUrl = this.buildTargetUrl(targetInstance.url, req.path, req.query)
        
        // Prepare proxy options
        const proxyOptions = {
          target: targetUrl,
          changeOrigin: true,
          timeout: 30000,
          proxyTimeout: 30000,
          headers: {
            'X-Forwarded-For': req.ip,
            'X-Forwarded-Proto': req.protocol,
            'X-Forwarded-Host': req.get('host'),
            'X-Real-IP': req.ip,
            'X-Request-ID': (req as any).correlationId || 'unknown',
            'X-Service-Instance': targetInstance.id,
            'X-Client-Version': (req as any).apiVersion || 'v1'
          }
        }

        // Add authorization if present
        if (req.headers.authorization) {
          proxyOptions.headers['Authorization'] = req.headers.authorization
        }

        // Log the proxy request
        RequestLoggingMiddleware.logBusinessEvent('PROXY_REQUEST', {
          service: serviceName,
          instance: targetInstance.id,
          method: req.method,
          path: req.path,
          query: req.query,
          targetUrl,
          correlationId: (req as any).correlationId
        }, (req as any).userId, (req as any).correlationId)

        // Add user info to headers for downstream services
        if ((req as any).userId) {
          proxyOptions.headers['X-User-ID'] = (req as any).userId
        }
        if ((req as any).userTier) {
          proxyOptions.headers['X-User-Tier'] = (req as any).userTier
        }

        // Forward the request
        this.proxyRequest(req, res, proxyOptions)
        
      } catch (error) {
        console.error('Proxy error:', error)
        res.status(502).json({
          success: false,
          error: 'PROXY_ERROR',
          message: 'Failed to proxy request to backend service',
          code: 'PROXY_ERROR'
        })
      }
    })

    console.log('✅ Service proxy middleware configured')
  }

  private async proxyRequest(req: Request, res: Response, options: any) {
    try {
      const startTime = Date.now()
      
      // Prepare request options
      const requestOptions: RequestInit = {
        method: req.method,
        headers: options.headers,
        signal: AbortSignal.timeout(options.timeout)
      }

      // Add body for non-GET requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body) {
          requestOptions.body = JSON.stringify(req.body)
          ;(requestOptions.headers as any)['Content-Type'] = 'application/json'
        }
      }

      // Make the request using native fetch
      const response = await fetch(options.target, requestOptions)
      const responseTime = Date.now() - startTime

      // Set response headers
      res.set('X-Response-Time', `${responseTime}ms`)
      res.set('X-Target-Instance', options.headers['X-Service-Instance'])
      
      // Forward response status and headers
      res.status(response.status)
      
      // Copy relevant headers
      const headersToCopy = [
        'content-type', 'content-length', 'cache-control', 'etag', 
        'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'
      ]
      
      for (const header of headersToCopy) {
        const value = response.headers.get(header)
        if (value) {
          res.set(header, value)
        }
      }

      // Send response body
      const body = await response.text()
      res.send(body)

      // Log successful proxy
      RequestLoggingMiddleware.logBusinessEvent('PROXY_SUCCESS', {
        targetUrl: options.target,
        method: req.method,
        statusCode: response.status,
        responseTime,
        instance: options.headers['X-Service-Instance']
      })

    } catch (error) {
      console.error('Proxy request failed:', error)
      
      RequestLoggingMiddleware.logSecurityEvent('PROXY_FAILURE', {
        targetUrl: options.target,
        method: req.method,
        error: error.message,
        instance: options.headers['X-Service-Instance']
      }, req)

      res.status(502).json({
        success: false,
        error: 'PROXY_ERROR',
        message: 'Backend service unavailable',
        code: 'PROXY_ERROR'
      })
    }
  }

  private configureHealthCheck(app: Express) {
    // Gateway health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      })
    })

    // Detailed health check with service status
    app.get('/health/detailed', async (req, res) => {
      try {
        const [gatewayHealth, serviceHealth] = await Promise.all([
          this.getGatewayHealth(),
          LoadBalancingMiddleware.getServiceHealthSummary()
        ])

        res.json({
          gateway: gatewayHealth,
          services: serviceHealth,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        })
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    })

    console.log('✅ Health check endpoints configured')
  }

  private configureAdminEndpoints(app: Express) {
    // Service status endpoint
    app.get('/admin/services/status', async (req, res) => {
      try {
        const stats = await LoadBalancingMiddleware.getLoadBalancingStats()
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'ADMIN_ERROR'
        })
      }
    })

    // Performance metrics endpoint
    app.get('/admin/metrics/performance', async (req, res) => {
      try {
        const { timeframe = '1h' } = req.query
        const summary = await PerformanceMonitoringMiddleware.getPerformanceSummary()
        const history = await PerformanceMonitoringMiddleware.getPerformanceHistory(timeframe as string)
        const topEndpoints = await PerformanceMonitoringMiddleware.getTopEndpoints(10)

        res.json({
          success: true,
          data: {
            summary,
            history,
            topEndpoints
          },
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'METRICS_ERROR'
        })
      }
    })

    // Version statistics endpoint
    app.get('/admin/metrics/versions', async (req, res) => {
      try {
        const stats = await ApiVersioningMiddleware.getVersionStatistics('24h')
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'VERSION_METRICS_ERROR'
        })
      }
    })

    // Circuit breaker status endpoint
    app.get('/admin/circuit-breakers/status', async (req, res) => {
      try {
        const status = await CircuitBreakerMiddleware.getAllServicesStatus()
        res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'CIRCUIT_BREAKER_ERROR'
        })
      }
    })

    console.log('✅ Admin endpoints configured')
  }

  private configureErrorHandling(app: Express) {
    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      RequestLoggingMiddleware.logSecurityEvent('API_NOT_FOUND', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }, req)

      res.status(404).json({
        success: false,
        error: 'API_NOT_FOUND',
        message: `API endpoint not found: ${req.path}`,
        code: 'API_NOT_FOUND',
        availableEndpoints: this.getAvailableEndpoints()
      })
    })

    // Global error handler
    app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Gateway error:', error)
      
      RequestLoggingMiddleware.logSecurityEvent('GATEWAY_ERROR', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        correlationId: (req as any).correlationId
      }, req)

      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: (req as any).correlationId
      })
    })

    console.log('✅ Error handling middleware configured')
  }

  private extractServiceName(path: string): string | null {
    const match = path.match(/^\/api\/v[0-9]+\/([^/]+)/)
    return match ? match[1] : null
  }

  private buildTargetUrl(baseUrl: string, path: string, query: any): string {
    // Remove API version prefix from path
    const cleanPath = path.replace(/^\/api\/v[0-9]+/, '')
    const url = new URL(baseUrl + cleanPath)
    
    // Add query parameters
    Object.keys(query).forEach(key => {
      url.searchParams.append(key, query[key])
    })
    
    return url.toString()
  }

  private async getGatewayHealth() {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodeVersion: process.version,
      platform: process.platform
    }
  }

  private getAvailableEndpoints(): string[] {
    return [
      'GET /api/v1/customers',
      'GET /api/v1/customers/:id',
      'POST /api/v1/customers',
      'PUT /api/v1/customers/:id',
      'DELETE /api/v1/customers/:id',
      'GET /api/v1/sales',
      'GET /api/v1/sales/:id',
      'POST /api/v1/sales',
      'POST /api/v1/sales/:id/process-payment',
      'POST /api/v1/sales/:id/cancel',
      'GET /api/v1/inventory/companies/:companyId/low-stock',
      'PUT /api/v1/inventory/:productId/companies/:companyId/stock',
      'GET /health',
      'GET /health/detailed'
    ]
  }

  /**
   * Get current configuration
   */
  getConfig(): GatewayConfig {
    return { ...this.config }
  }

  /**
   * Update configuration (admin only)
   */
  updateConfig(newConfig: Partial<GatewayConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log('Gateway configuration updated')
  }

  /**
   * Get gateway statistics
   */
  async getGatewayStats() {
    try {
      const performance = await PerformanceMonitoringMiddleware.getCurrentPerformance()
      const services = await LoadBalancingMiddleware.getServiceHealthSummary()
      const versions = await ApiVersioningMiddleware.getVersionStatistics('1h')
      const circuitBreakers = await CircuitBreakerMiddleware.getAllServicesStatus()

      return {
        timestamp: new Date().toISOString(),
        performance,
        services,
        versions,
        circuitBreakers,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    } catch (error) {
      console.error('Failed to get gateway stats:', error)
      return null
    }
  }
}

export default GatewayMiddlewareStack

// Export middleware functions
export const {
  configureMiddleware
} = new GatewayMiddlewareStack()

// Export the class for advanced usage
export { GatewayMiddlewareStack, GatewayConfig }