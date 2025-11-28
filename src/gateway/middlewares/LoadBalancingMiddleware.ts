import { Request, Response, NextFunction } from 'express'
import { RedisClient } from '@shared/redis/RedisClient'

// Service instance configuration
interface ServiceInstance {
  id: string
  url: string
  weight: number
  health: 'healthy' | 'unhealthy' | 'unknown'
  activeConnections: number
  responseTime: number
  lastHealthCheck: Date
  metadata: {
    region?: string
    version?: string
    capabilities?: string[]
  }
}

// Load balancing algorithms
enum LoadBalancingAlgorithm {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  IP_HASH = 'ip_hash',
  RANDOM = 'random',
  FASTEST_RESPONSE = 'fastest_response'
}

// Service configuration
interface ServiceConfig {
  name: string
  instances: ServiceInstance[]
  algorithm: LoadBalancingAlgorithm
  healthCheckInterval: number
  healthCheckTimeout: number
  circuitBreakerEnabled: boolean
  stickySessions: boolean
  region?: string
}

class LoadBalancingMiddleware {
  private redis: RedisClient
  private services: Map<string, ServiceConfig> = new Map()
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map()
  private roundRobinCounters: Map<string, number> = new Map()

  constructor() {
    this.redis = RedisClient.getInstance()
    this.initializeServices()
    this.startHealthChecks()
  }

  private initializeServices() {
    // Auth Service Configuration
    this.services.set('auth', {
      name: 'auth',
      algorithm: LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN,
      healthCheckInterval: 30000,
      healthCheckTimeout: 5000,
      circuitBreakerEnabled: true,
      stickySessions: true,
      instances: [
        {
          id: 'auth-1',
          url: process.env.AUTH_INSTANCE_1_URL || 'http://localhost:3001',
          weight: 3,
          health: 'unknown',
          activeConnections: 0,
          responseTime: 0,
          lastHealthCheck: new Date(),
          metadata: { region: 'us-east-1', version: 'v1.2.3' }
        },
        {
          id: 'auth-2',
          url: process.env.AUTH_INSTANCE_2_URL || 'http://localhost:3002',
          weight: 2,
          health: 'unknown',
          activeConnections: 0,
          responseTime: 0,
          lastHealthCheck: new Date(),
          metadata: { region: 'us-west-2', version: 'v1.2.3' }
        },
        {
          id: 'auth-3',
          url: process.env.AUTH_INSTANCE_3_URL || 'http://localhost:3003',
          weight: 1,
          health: 'unknown',
          activeConnections: 0,
          responseTime: 0,
          lastHealthCheck: new Date(),
          metadata: { region: 'eu-west-1', version: 'v1.2.3' }
        }
      ]
    })

    // Companies Service Configuration
    this.services.set('companies', {
      name: 'companies',
      algorithm: LoadBalancingAlgorithm.LEAST_CONNECTIONS,
      healthCheckInterval: 20000,
      healthCheckTimeout: 3000,
      circuitBreakerEnabled: true,
      stickySessions: false,
      instances: [
        {
          id: 'companies-1',
          url: process.env.COMPANIES_INSTANCE_1_URL || 'http://localhost:3004',
          weight: 2,
          health: 'unknown',
          activeConnections: 0,
          responseTime: 0,
          lastHealthCheck: new Date(),
          metadata: { region: 'us-east-1', version: 'v2.1.0' }
        },
        {
          id: 'companies-2',
          url: process.env.COMPANIES_INSTANCE_2_URL || 'http://localhost:3005',
          weight: 2,
          health: 'unknown',
          activeConnections: 0,
          responseTime: 0,
          lastHealthCheck: new Date(),
          metadata: { region: 'us-west-2', version: 'v2.1.0' }
        }
      ]
    })

    // Add other services...
    // This pattern would be repeated for customers, sales, inventory, etc.
  }

  private startHealthChecks() {
    for (const [serviceName, config] of this.services.entries()) {
      this.startHealthCheckForService(serviceName, config)
    }
  }

  private startHealthCheckForService(serviceName: string, config: ServiceConfig) {
    const interval = setInterval(async () => {
      await this.performHealthChecks(serviceName, config)
    }, config.healthCheckInterval)

    this.healthCheckIntervals.set(serviceName, interval)
  }

  private async performHealthChecks(serviceName: string, config: ServiceConfig) {
    for (const instance of config.instances) {
      try {
        const isHealthy = await this.checkInstanceHealth(instance, config.healthCheckTimeout)
        const previousHealth = instance.health
        
        instance.health = isHealthy ? 'healthy' : 'unhealthy'
        instance.lastHealthCheck = new Date()

        // Update health status in Redis
        await this.updateInstanceHealth(serviceName, instance)

        // Log health status changes
        if (previousHealth !== instance.health) {
          console.log(`Health check ${serviceName}/${instance.id}: ${previousHealth} -> ${instance.health}`)
          
          this.emitHealthChange(serviceName, instance, previousHealth, instance.health)
        }

      } catch (error) {
        instance.health = 'unhealthy'
        console.error(`Health check failed for ${serviceName}/${instance.id}:`, error)
      }
    }
  }

  private async checkInstanceHealth(instance: ServiceInstance, timeout: number): Promise<boolean> {
    try {
      const startTime = Date.now()
      const response = await fetch(`${instance.url}/health`, {
        method: 'GET',
        timeout,
        headers: {
          'User-Agent': 'API-Gateway-HealthCheck',
          'X-Health-Check': 'true'
        }
      })

      const responseTime = Date.now() - startTime
      instance.responseTime = responseTime

      // Consider instance unhealthy if response time is too high
      if (responseTime > timeout) {
        return false
      }

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async updateInstanceHealth(serviceName: string, instance: ServiceInstance) {
    try {
      const key = `health:${serviceName}:${instance.id}`
      const healthData = {
        health: instance.health,
        responseTime: instance.responseTime,
        lastCheck: instance.lastHealthCheck.toISOString(),
        activeConnections: instance.activeConnections
      }
      
      await this.redis.setex(key, 60, JSON.stringify(healthData)) // 1 minute TTL
    } catch (error) {
      console.error('Failed to update instance health:', error)
    }
  }

  private emitHealthChange(serviceName: string, instance: ServiceInstance, previous: string, current: string) {
    // Emit event for monitoring systems
    console.log(`HEALTH_CHANGE: ${serviceName}/${instance.id} ${previous} -> ${current}`)
  }

  /**
   * Main load balancing middleware
   */
  createLoadBalancingMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Determine target service from request path
        const serviceName = this.extractServiceFromPath(req.path)
        
        if (!serviceName) {
          return next() // Not a service route
        }

        const serviceConfig = this.services.get(serviceName)
        if (!serviceConfig) {
          return res.status(503).json({
            success: false,
            error: 'SERVICE_NOT_CONFIGURED',
            message: `Service ${serviceName} is not configured for load balancing`,
            code: 'SERVICE_NOT_CONFIGURED'
          })
        }

        // Check if sticky sessions are required
        const stickyInstance = await this.getStickyInstance(req, serviceName, serviceConfig)
        
        let targetInstance: ServiceInstance
        if (stickyInstance) {
          targetInstance = stickyInstance
        } else {
          // Select instance based on algorithm
          targetInstance = await this.selectInstance(req, serviceName, serviceConfig)
        }

        if (!targetInstance) {
          return res.status(503).json({
            success: false,
            error: 'NO_HEALTHY_INSTANCES',
            message: `No healthy instances available for service ${serviceName}`,
            code: 'NO_HEALTHY_INSTANCES',
            service: serviceName
          })
        }

        // Add instance info to request for proxy middleware
        ;(req as any).targetInstance = targetInstance
        ;(req as any).serviceName = serviceName

        // Track active connections
        targetInstance.activeConnections++

        // Remove tracking after response
        const originalEnd = res.end.bind(res)
        res.end = ((...args: any[]) => {
          targetInstance.activeConnections--
          return originalEnd(...args)
        })()

        next()
      } catch (error) {
        console.error('Load balancing error:', error)
        res.status(500).json({
          success: false,
          error: 'LOAD_BALANCING_ERROR',
          message: 'Load balancing error occurred',
          code: 'LOAD_BALANCING_ERROR'
        })
      }
    }
  }

  private extractServiceFromPath(path: string): string | null {
    // Extract service name from path pattern: /api/v1/serviceName/...
    const match = path.match(/^\/api\/v[0-9]+\/([^/]+)/)
    return match ? match[1] : null
  }

  private async getStickyInstance(req: Request, serviceName: string, config: ServiceConfig): Promise<ServiceInstance | null> {
    if (!config.stickySessions) {
      return null
    }

    // Try to get sticky instance from session/cookie
    const sessionId = this.getSessionId(req)
    if (!sessionId) {
      return null
    }

    try {
      const stickyKey = `sticky:${serviceName}:${sessionId}`
      const stickyInstanceId = await this.redis.get(stickyKey)
      
      if (stickyInstanceId) {
        const instance = config.instances.find(i => i.id === stickyInstanceId)
        if (instance && instance.health === 'healthy') {
          return instance
        }
      }
    } catch (error) {
      console.error('Error getting sticky instance:', error)
    }

    return null
  }

  private getSessionId(req: Request): string | null {
    // Try different methods to get session ID
    return req.get('X-Session-ID') || 
           (req.cookies && req.cookies.sessionId) ||
           (req.headers.authorization && this.extractSessionId(req.headers.authorization)) ||
           null
  }

  private extractSessionId(authorization: string): string | null {
    const match = authorization.match(/session-id[:=]([a-zA-Z0-9-]+)/)
    return match ? match[1] : null
  }

  private async selectInstance(req: Request, serviceName: string, config: ServiceConfig): Promise<ServiceInstance | null> {
    const healthyInstances = config.instances.filter(instance => instance.health === 'healthy')
    
    if (healthyInstances.length === 0) {
      return null
    }

    let selectedInstance: ServiceInstance

    switch (config.algorithm) {
      case LoadBalancingAlgorithm.ROUND_ROBIN:
        selectedInstance = this.selectRoundRobin(healthyInstances, serviceName)
        break
        
      case LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN:
        selectedInstance = this.selectWeightedRoundRobin(healthyInstances, serviceName)
        break
        
      case LoadBalancingAlgorithm.LEAST_CONNECTIONS:
        selectedInstance = this.selectLeastConnections(healthyInstances)
        break
        
      case LoadBalancingAlgorithm.IP_HASH:
        selectedInstance = this.selectIpHash(req, healthyInstances)
        break
        
      case LoadBalancingAlgorithm.FASTEST_RESPONSE:
        selectedInstance = this.selectFastestResponse(healthyInstances)
        break
        
      case LoadBalancingAlgorithm.RANDOM:
        selectedInstance = this.selectRandom(healthyInstances)
        break
        
      default:
        selectedInstance = healthyInstances[0]
    }

    // Set sticky session if enabled
    if (config.stickySessions) {
      await this.setStickySession(req, serviceName, selectedInstance)
    }

    return selectedInstance
  }

  private selectRoundRobin(instances: ServiceInstance[], serviceName: string): ServiceInstance {
    const counter = this.roundRobinCounters.get(serviceName) || 0
    const selected = instances[counter % instances.length]
    this.roundRobinCounters.set(serviceName, counter + 1)
    return selected
  }

  private selectWeightedRoundRobin(instances: ServiceInstance[], serviceName: string): ServiceInstance {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const instance of instances) {
      currentWeight += instance.weight
      if (random <= currentWeight) {
        return instance
      }
    }
    
    return instances[instances.length - 1]
  }

  private selectLeastConnections(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, instance) => 
      instance.activeConnections < min.activeConnections ? instance : min
    )
  }

  private selectIpHash(req: Request, instances: ServiceInstance[]): ServiceInstance {
    const clientIp = this.getClientIP(req)
    const hash = this.hashCode(clientIp)
    return instances[hash % instances.length]
  }

  private selectFastestResponse(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((fastest, instance) => 
      instance.responseTime < fastest.responseTime ? instance : fastest
    )
  }

  private selectRandom(instances: ServiceInstance[]): ServiceInstance {
    return instances[Math.floor(Math.random() * instances.length)]
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return (req.ip || req.connection.remoteAddress || 'unknown').replace(/^::ffff:/, '')
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private async setStickySession(req: Request, serviceName: string, instance: ServiceInstance) {
    try {
      const sessionId = this.getSessionId(req)
      if (!sessionId) return

      const stickyKey = `sticky:${serviceName}:${sessionId}`
      const ttl = 3600 // 1 hour
      
      await this.redis.setex(stickyKey, ttl, instance.id)
    } catch (error) {
      console.error('Error setting sticky session:', error)
    }
  }

  /**
   * Get load balancing statistics
   */
  async getLoadBalancingStats() {
    const stats: Record<string, any> = {}

    for (const [serviceName, config] of this.services.entries()) {
      const serviceStats = {
        algorithm: config.algorithm,
        healthyInstances: config.instances.filter(i => i.health === 'healthy').length,
        totalInstances: config.instances.length,
        instances: config.instances.map(instance => ({
          id: instance.id,
          url: instance.url,
          health: instance.health,
          activeConnections: instance.activeConnections,
          responseTime: instance.responseTime,
          weight: instance.weight,
          lastHealthCheck: instance.lastHealthCheck,
          metadata: instance.metadata
        }))
      }

      stats[serviceName] = serviceStats
    }

    return stats
  }

  /**
   * Add new instance to service (admin only)
   */
  async addInstance(serviceName: string, instance: ServiceInstance) {
    const config = this.services.get(serviceName)
    if (!config) {
      throw new Error(`Service ${serviceName} not found`)
    }

    config.instances.push(instance)
    
    // Update Redis configuration
    await this.updateServiceConfig(serviceName, config)
    
    console.log(`Added new instance ${instance.id} to service ${serviceName}`)
  }

  /**
   * Remove instance from service (admin only)
   */
  async removeInstance(serviceName: string, instanceId: string) {
    const config = this.services.get(serviceName)
    if (!config) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const instanceIndex = config.instances.findIndex(i => i.id === instanceId)
    if (instanceIndex === -1) {
      throw new Error(`Instance ${instanceId} not found in service ${serviceName}`)
    }

    const instance = config.instances[instanceIndex]
    config.instances.splice(instanceIndex, 1)
    
    // Clean up sticky sessions
    await this.redis.del(`sticky:${serviceName}:*`)
    
    // Update Redis configuration
    await this.updateServiceConfig(serviceName, config)
    
    console.log(`Removed instance ${instanceId} from service ${serviceName}`)
  }

  /**
   * Update instance health (admin only)
   */
  async updateInstanceHealth(serviceName: string, instanceId: string, health: 'healthy' | 'unhealthy') {
    const config = this.services.get(serviceName)
    if (!config) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const instance = config.instances.find(i => i.id === instanceId)
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    const previousHealth = instance.health
    instance.health = health
    instance.lastHealthCheck = new Date()

    await this.updateInstanceHealth(serviceName, instance)
    
    this.emitHealthChange(serviceName, instance, previousHealth, health)
  }

  private async updateServiceConfig(serviceName: string, config: ServiceConfig) {
    try {
      const key = `loadbalancer:service:${serviceName}`
      await this.redis.setex(key, 3600, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to update service config:', error)
    }
  }

  /**
   * Get service health summary
   */
  async getServiceHealthSummary() {
    const summary: Record<string, any> = {}

    for (const [serviceName, config] of this.services.entries()) {
      const healthyCount = config.instances.filter(i => i.health === 'healthy').length
      const totalInstances = config.instances.length
      const totalConnections = config.instances.reduce((sum, i) => sum + i.activeConnections, 0)
      const avgResponseTime = config.instances.reduce((sum, i) => sum + i.responseTime, 0) / totalInstances

      summary[serviceName] = {
        status: healthyCount > 0 ? 'healthy' : 'unhealthy',
        healthyInstances: healthyCount,
        totalInstances,
        totalActiveConnections: totalConnections,
        averageResponseTime: Math.round(avgResponseTime),
        algorithm: config.algorithm,
        lastHealthCheck: new Date().toISOString()
      }
    }

    return summary
  }

  /**
   * Shutdown load balancer
   */
  shutdown() {
    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval)
    }
    this.healthCheckIntervals.clear()
    
    console.log('Load balancer shutdown complete')
  }
}

export default new LoadBalancingMiddleware()

// Export middleware function
export const {
  createLoadBalancingMiddleware
} = new LoadBalancingMiddleware()

// Export enums and interfaces
export {
  LoadBalancingAlgorithm,
  ServiceInstance,
  ServiceConfig
}

// Export the class for advanced usage
export { LoadBalancingMiddleware }