import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client'
import { EventEmitter } from 'events'

// Configuração das métricas
export interface MetricsConfig {
  serviceName: string
  serviceVersion: string
  environment: string
  namespace: string
  enableDefaultMetrics: boolean
  customLabels: Record<string, string>
}

export interface BusinessMetrics {
  // Sales Metrics
  salesTotal: number
  salesConfirmed: number
  salesCancelled: number
  revenueTotal: number
  averageOrderValue: number
  conversionRate: number
  
  // Inventory Metrics
  inventoryValue: number
  lowStockProducts: number
  outOfStockProducts: number
  inventoryTurnover: number
  
  // Customer Metrics
  customerRegistrations: number
  activeCustomers: number
  customerRetentionRate: number
  
  // Product Metrics
  productsCreated: number
  productsSold: number
  topSellingProducts: Array<{ productId: string; quantity: number }>
}

export interface PerformanceMetrics {
  // Response Time Metrics
  httpRequestDuration: Histogram<string>
  databaseQueryDuration: Histogram<string>
  cacheOperationDuration: Histogram<string>
  externalServiceDuration: Histogram<string>
  
  // Throughput Metrics
  httpRequestsTotal: Counter<string>
  httpRequestsRate: Gauge<string>
  
  // Error Metrics
  httpErrorsTotal: Counter<string>
  databaseErrorsTotal: Counter<string>
  externalServiceErrorsTotal: Counter<string>
  
  // Database Performance
  databaseConnectionsActive: Gauge<string>
  databaseQueryRate: Gauge<string>
  databaseConnectionPoolUtilization: Gauge<string>
  
  // Cache Performance
  cacheHitsTotal: Counter<string>
  cacheMissesTotal: Counter<string>
  cacheHitRate: Gauge<string>
  cacheOperationsTotal: Counter<string>
  
  // System Resources
  memoryUsageBytes: Gauge<string>
  cpuUsagePercent: Gauge<string>
  diskUsageBytes: Gauge<string>
  eventLoopDelay: Histogram<string>
}

export interface HealthMetrics {
  servicesHealth: Record<string, 'healthy' | 'unhealthy' | 'degraded'>
  databaseConnections: number
  queueDepth: number
  activeConnections: number
  uptimeSeconds: number
  lastHealthCheck: Date
}

class MetricsService extends EventEmitter {
  private config: MetricsConfig
  private businessMetrics: BusinessMetrics
  private performanceMetrics: PerformanceMetrics
  private healthMetrics: HealthMetrics
  private startTime: Date

  constructor(config: MetricsConfig) {
    super()
    this.config = {
      enableDefaultMetrics: true,
      customLabels: {},
      ...config
    }
    
    this.startTime = new Date()
    this.businessMetrics = this.initializeBusinessMetrics()
    this.performanceMetrics = this.initializePerformanceMetrics()
    this.healthMetrics = this.initializeHealthMetrics()
    
    this.initializeMetrics()
  }

  private initializeBusinessMetrics(): BusinessMetrics {
    return {
      salesTotal: 0,
      salesConfirmed: 0,
      salesCancelled: 0,
      revenueTotal: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      inventoryValue: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      inventoryTurnover: 0,
      customerRegistrations: 0,
      activeCustomers: 0,
      customerRetentionRate: 0,
      productsCreated: 0,
      productsSold: 0,
      topSellingProducts: []
    }
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    const commonLabels = this.getCommonLabels()
    
    return {
      // HTTP Request Metrics
      httpRequestDuration: new Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code', 'service'],
        buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        registers: [register],
        ...commonLabels
      }),

      databaseQueryDuration: new Histogram({
        name: 'database_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['query_type', 'table', 'service'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
        registers: [register],
        ...commonLabels
      }),

      cacheOperationDuration: new Histogram({
        name: 'cache_operation_duration_seconds',
        help: 'Duration of cache operations in seconds',
        labelNames: ['operation', 'cache_name', 'service'],
        buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
        registers: [register],
        ...commonLabels
      }),

      externalServiceDuration: new Histogram({
        name: 'external_service_duration_seconds',
        help: 'Duration of external service calls in seconds',
        labelNames: ['service_name', 'endpoint', 'service'],
        buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30],
        registers: [register],
        ...commonLabels
      }),

      // HTTP Request Counters
      httpRequestsTotal: new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'service'],
        registers: [register],
        ...commonLabels
      }),

      httpRequestsRate: new Gauge({
        name: 'http_requests_rate',
        help: 'Current HTTP request rate',
        labelNames: ['service'],
        registers: [register],
        ...commonLabels
      }),

      // Error Counters
      httpErrorsTotal: new Counter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['method', 'route', 'status_code', 'service'],
        registers: [register],
        ...commonLabels
      }),

      databaseErrorsTotal: new Counter({
        name: 'database_errors_total',
        help: 'Total number of database errors',
        labelNames: ['query_type', 'table', 'error_type', 'service'],
        registers: [register],
        ...commonLabels
      }),

      externalServiceErrorsTotal: new Counter({
        name: 'external_service_errors_total',
        help: 'Total number of external service errors',
        labelNames: ['service_name', 'endpoint', 'error_type', 'service'],
        registers: [register],
        ...commonLabels
      }),

      // Database Performance
      databaseConnectionsActive: new Gauge({
        name: 'database_connections_active',
        help: 'Number of active database connections',
        labelNames: ['database', 'service'],
        registers: [register],
        ...commonLabels
      }),

      databaseQueryRate: new Gauge({
        name: 'database_query_rate',
        help: 'Current database query rate',
        labelNames: ['service'],
        registers: [register],
        ...commonLabels
      }),

      databaseConnectionPoolUtilization: new Gauge({
        name: 'database_connection_pool_utilization',
        help: 'Database connection pool utilization percentage',
        labelNames: ['database', 'service'],
        registers: [register],
        ...commonLabels
      }),

      // Cache Performance
      cacheHitsTotal: new Counter({
        name: 'cache_hits_total',
        help: 'Total number of cache hits',
        labelNames: ['cache_name', 'service'],
        registers: [register],
        ...commonLabels
      }),

      cacheMissesTotal: new Counter({
        name: 'cache_misses_total',
        help: 'Total number of cache misses',
        labelNames: ['cache_name', 'service'],
        registers: [register],
        ...commonLabels
      }),

      cacheHitRate: new Gauge({
        name: 'cache_hit_rate',
        help: 'Current cache hit rate',
        labelNames: ['cache_name', 'service'],
        registers: [register],
        ...commonLabels
      }),

      cacheOperationsTotal: new Counter({
        name: 'cache_operations_total',
        help: 'Total number of cache operations',
        labelNames: ['operation', 'cache_name', 'service'],
        registers: [register],
        ...commonLabels
      }),

      // System Resources
      memoryUsageBytes: new Gauge({
        name: 'memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['service'],
        registers: [register],
        ...commonLabels
      }),

      cpuUsagePercent: new Gauge({
        name: 'cpu_usage_percent',
        help: 'CPU usage percentage',
        labelNames: ['service'],
        registers: [register],
        ...commonLabels
      }),

      diskUsageBytes: new Gauge({
        name: 'disk_usage_bytes',
        help: 'Disk usage in bytes',
        labelNames: ['service'],
        registers: [register],
        ...commonLabels
      }),

      eventLoopDelay: new Histogram({
        name: 'event_loop_delay_seconds',
        help: 'Event loop delay in seconds',
        labelNames: ['service'],
        buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
        registers: [register],
        ...commonLabels
      })
    }
  }

  private initializeHealthMetrics(): HealthMetrics {
    return {
      servicesHealth: {},
      databaseConnections: 0,
      queueDepth: 0,
      activeConnections: 0,
      uptimeSeconds: 0,
      lastHealthCheck: new Date()
    }
  }

  private async initializeMetrics(): Promise<void> {
    // Collect default metrics if enabled
    if (this.config.enableDefaultMetrics) {
      collectDefaultMetrics({
        registers: [register],
        prefix: `${this.config.namespace}_`,
        labels: this.getCommonLabels()
      })
    }

    // Start system metrics collection
    this.startSystemMetricsCollection()
    
    console.log('✅ Metrics service initialized')
  }

  private getCommonLabels() {
    return {
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      environment: this.config.environment,
      namespace: this.config.namespace,
      ...this.config.customLabels
    }
  }

  private startSystemMetricsCollection(): void {
    // Memory and CPU metrics
    setInterval(async () => {
      try {
        const memUsage = process.memoryUsage()
        this.performanceMetrics.memoryUsageBytes.set({
          ...this.getCommonLabels(),
          type: 'heap'
        }, memUsage.heapUsed)
        
        this.performanceMetrics.memoryUsageBytes.set({
          ...this.getCommonLabels(),
          type: 'rss'
        }, memUsage.rss)

        // Event loop delay
        const start = process.hrtime.bigint()
        setImmediate(() => {
          const delay = Number(process.hrtime.bigint() - start) / 1e9
          this.performanceMetrics.eventLoopDelay.observe(this.getCommonLabels(), delay)
        })

        // Update uptime
        this.healthMetrics.uptimeSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000)
        this.healthMetrics.lastHealthCheck = new Date()
        
      } catch (error) {
        console.error('Error collecting system metrics:', error)
      }
    }, 10000) // Every 10 seconds
  }

  // Business Metrics Methods
  recordSale(saleAmount: number, status: 'confirmed' | 'cancelled' = 'confirmed'): void {
    this.businessMetrics.salesTotal++
    this.businessMetrics.revenueTotal += saleAmount
    this.businessMetrics.averageOrderValue = this.businessMetrics.revenueTotal / this.businessMetrics.salesTotal

    if (status === 'confirmed') {
      this.businessMetrics.salesConfirmed++
    } else {
      this.businessMetrics.salesCancelled++
    }

    this.businessMetrics.conversionRate = this.businessMetrics.salesTotal > 0 
      ? this.businessMetrics.salesConfirmed / this.businessMetrics.salesTotal 
      : 0

    this.emit('businessMetricUpdated', { type: 'sale', value: saleAmount, status })
  }

  recordCustomerRegistration(): void {
    this.businessMetrics.customerRegistrations++
    this.emit('businessMetricUpdated', { type: 'customer_registration' })
  }

  recordProductCreation(): void {
    this.businessMetrics.productsCreated++
    this.emit('businessMetricUpdated', { type: 'product_creation' })
  }

  recordProductSale(productId: string, quantity: number): void {
    this.businessMetrics.productsSold += quantity
    
    // Update top selling products
    const existing = this.businessMetrics.topSellingProducts.find(p => p.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      this.businessMetrics.topSellingProducts.push({ productId, quantity })
    }
    
    // Keep only top 10
    this.businessMetrics.topSellingProducts.sort((a, b) => b.quantity - a.quantity)
    this.businessMetrics.topSellingProducts = this.businessMetrics.topSellingProducts.slice(0, 10)
    
    this.emit('businessMetricUpdated', { type: 'product_sale', productId, quantity })
  }

  updateInventoryMetrics(value: number, lowStock: number, outOfStock: number): void {
    this.businessMetrics.inventoryValue = value
    this.businessMetrics.lowStockProducts = lowStock
    this.businessMetrics.outOfStockProducts = outOfStock
    this.emit('businessMetricUpdated', { type: 'inventory', value, lowStock, outOfStock })
  }

  // Performance Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = {
      ...this.getCommonLabels(),
      method,
      route,
      status_code: statusCode.toString()
    }

    this.performanceMetrics.httpRequestDuration.observe(labels, duration)
    this.performanceMetrics.httpRequestsTotal.inc(labels)
    
    if (statusCode >= 400) {
      this.performanceMetrics.httpErrorsTotal.inc(labels)
    }
  }

  recordDatabaseQuery(queryType: string, table: string, duration: number, error?: string): void {
    const labels = {
      ...this.getCommonLabels(),
      query_type: queryType,
      table
    }

    this.performanceMetrics.databaseQueryDuration.observe(labels, duration)
    
    if (error) {
      this.performanceMetrics.databaseErrorsTotal.inc({
        ...labels,
        error_type: this.categorizeError(error)
      })
    }
  }

  recordCacheOperation(operation: 'get' | 'set' | 'delete', cacheName: string, duration: number, hit: boolean): void {
    const labels = {
      ...this.getCommonLabels(),
      operation,
      cache_name: cacheName
    }

    this.performanceMetrics.cacheOperationDuration.observe(labels, duration)
    this.performanceMetrics.cacheOperationsTotal.inc(labels)
    
    if (operation === 'get') {
      if (hit) {
        this.performanceMetrics.cacheHitsTotal.inc(labels)
      } else {
        this.performanceMetrics.cacheMissesTotal.inc(labels)
      }
      
      // Update hit rate
      this.updateCacheHitRate(cacheName)
    }
  }

  recordExternalServiceCall(serviceName: string, endpoint: string, duration: number, error?: string): void {
    const labels = {
      ...this.getCommonLabels(),
      service_name: serviceName,
      endpoint
    }

    this.performanceMetrics.externalServiceDuration.observe(labels, duration)
    
    if (error) {
      this.performanceMetrics.externalServiceErrorsTotal.inc({
        ...labels,
        error_type: this.categorizeError(error)
      })
    }
  }

  updateDatabaseMetrics(activeConnections: number, queryRate: number, poolUtilization: number): void {
    this.performanceMetrics.databaseConnectionsActive.set({
      ...this.getCommonLabels(),
      database: 'postgresql'
    }, activeConnections)
    
    this.performanceMetrics.databaseQueryRate.set(this.getCommonLabels(), queryRate)
    this.performanceMetrics.databaseConnectionPoolUtilization.set({
      ...this.getCommonLabels(),
      database: 'postgresql'
    }, poolUtilization)
    
    this.healthMetrics.databaseConnections = activeConnections
  }

  // Health Metrics Methods
  updateServiceHealth(serviceName: string, status: 'healthy' | 'unhealthy' | 'degraded'): void {
    this.healthMetrics.servicesHealth[serviceName] = status
    this.emit('healthMetricUpdated', { service: serviceName, status })
  }

  updateQueueDepth(queueName: string, depth: number): void {
    this.healthMetrics.queueDepth = depth
    this.emit('healthMetricUpdated', { queue: queueName, depth })
  }

  updateActiveConnections(count: number): void {
    this.healthMetrics.activeConnections = count
    this.emit('healthMetricUpdated', { activeConnections: count })
  }

  // Helper Methods
  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'timeout'
    if (error.includes('connection')) return 'connection'
    if (error.includes('validation')) return 'validation'
    if (error.includes('permission')) return 'permission'
    return 'unknown'
  }

  private updateCacheHitRate(cacheName: string): void {
    // This would typically be calculated from actual hits/misses
    // For now, we'll use a mock calculation
    const hitRate = 0.85 // 85% hit rate mock
    this.performanceMetrics.cacheHitRate.set({
      ...this.getCommonLabels(),
      cache_name: cacheName
    }, hitRate)
  }

  // Public Getters
  getBusinessMetrics(): BusinessMetrics {
    return { ...this.businessMetrics }
  }

  getHealthMetrics(): HealthMetrics {
    return { ...this.healthMetrics }
  }

  async getMetrics(): Promise<string> {
    return register.metrics()
  }

  async getMetricsJSON(): Promise<object> {
    const metrics = await register.getMetricsAsJSON()
    return {
      business: this.businessMetrics,
      performance: metrics,
      health: this.healthMetrics,
      timestamp: new Date().toISOString()
    }
  }

  // Reset methods for testing
  resetBusinessMetrics(): void {
    this.businessMetrics = this.initializeBusinessMetrics()
  }

  resetPerformanceMetrics(): void {
    register.clear()
    this.performanceMetrics = this.initializePerformanceMetrics()
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Test if metrics can be generated
      await this.getMetrics()
      return true
    } catch (error) {
      return false
    }
  }
}

export default MetricsService