// Exemplo de configuração e uso dos serviços da Fase 9
import MetricsService from '../shared/services/MetricsService'
import LoggerService from '../shared/services/LoggerService'
import HealthCheckService from '../shared/services/HealthCheckService'
import HealthCheckEndpoints from '../shared/services/HealthCheckEndpoints'
import TracingService from '../shared/services/TracingService'
import ResourceMonitoringService from '../shared/services/ResourceMonitoringService'
import ExternalServicesMonitoring from '../shared/services/ExternalServicesMonitoring'
import AlertingService from '../shared/services/AlertingService'
import { createDefaultLogger } from '../shared/services/LoggerService'

// 1. Configuração completa do sistema de monitoring
async function initializeMonitoring() {
  console.log('📊 Inicializando sistema de monitoring e observabilidade...')
  
  // Logger service
  const logger = createDefaultLogger()
  
  // Metrics service
  const metricsService = new MetricsService({
    serviceName: 'e-estoque-api',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    namespace: 'eestoque',
    enableDefaultMetrics: true,
    customLabels: {
      team: 'backend',
      project: 'e-estoque'
    }
  })
  
  // Health check service
  const healthCheckService = new HealthCheckService({
    timeout: 5000,
    interval: 30000,
    retryAttempts: 3,
    thresholds: {
      responseTime: 1000,
      memoryUsage: 80,
      cpuUsage: 80,
      diskUsage: 85
    }
  }, logger)
  
  // Tracing service
  const tracingService = new TracingService({
    serviceName: 'e-estoque-api',
    enableTracing: true,
    maxSpansPerTrace: 1000,
    traceSamplingRate: 1.0,
    enableDistributedTracing: true
  }, logger)
  
  // Resource monitoring service
  const resourceMonitoring = new ResourceMonitoringService({
    enableCpuMonitoring: true,
    enableMemoryMonitoring: true,
    enableDiskMonitoring: true,
    collectionInterval: 30000,
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      diskUsage: 90,
      responseTime: 1000,
      eventLoopDelay: 100
    }
  }, logger)
  
  // External services monitoring
  const externalMonitoring = new ExternalServicesMonitoring(logger)
  
  // Alerting service
  const alertingService = new AlertingService(logger)
  
  // Start all monitoring services
  await healthCheckService.startMonitoring()
  await resourceMonitoring.startMonitoring()
  await externalMonitoring.startMonitoring()
  alertingService.startAlertEvaluation()
  
  console.log('✅ Sistema de monitoring inicializado')
  
  return {
    logger,
    metricsService,
    healthCheckService,
    tracingService,
    resourceMonitoring,
    externalMonitoring,
    alertingService
  }
}

// 2. Exemplos de uso dos serviços

// Exemplo 1: Metrics Collection
async function exemploMetrics(metricsService: MetricsService) {
  console.log('📊 Exemplo: Coleta de métricas...')
  
  // Métricas de negócio
  metricsService.recordSale(299.99, 'confirmed')
  metricsService.recordCustomerRegistration()
  metricsService.recordProductCreation()
  metricsService.recordProductSale('prod-123', 2)
  
  // Métricas de performance
  metricsService.recordHttpRequest('GET', '/api/products', 200, 45.5)
  metricsService.recordHttpRequest('POST', '/api/sales', 201, 123.4)
  metricsService.recordHttpRequest('GET', '/api/inventory', 500, 567.8) // Error
  
  // Métricas de banco
  metricsService.recordDatabaseQuery('SELECT', 'products', 12.3)
  metricsService.recordDatabaseQuery('INSERT', 'sales', 45.6, 'timeout error')
  
  // Métricas de cache
  metricsService.recordCacheOperation('get', 'products', 5.2, true)
  metricsService.recordCacheOperation('set', 'products', 8.1, false)
  
  // Métricas de serviços externos
  metricsService.recordExternalServiceCall('payment-gateway', '/process', 234.5)
  metricsService.recordExternalServiceCall('email-service', '/send', 123.4, 'connection timeout')
  
  console.log('✅ Métricas coletadas')
}

// Exemplo 2: Structured Logging
async function exemploLogging(logger: LoggerService) {
  console.log('📝 Exemplo: Logging estruturado...')
  
  // Logging básico
  logger.info('API request received', {
    method: 'POST',
    url: '/api/sales',
    userId: 'user-123'
  })
  
  // Business event logging
  logger.logBusinessEvent('sale_created', 'sale', 'sale-456', {
    amount: 199.99,
    customerId: 'cust-789',
    items: 3
  })
  
  // Security event logging
  logger.logSecurityEvent('failed_login_attempt', {
    email: 'user@example.com',
    ip: '192.168.1.100',
    attempts: 3
  })
  
  // Performance logging
  logger.logPerformance('database_query', 45.6)
  logger.logDatabaseOperation('SELECT', 'products', 12.3)
  logger.logCacheOperation('get', 'product:123', 5.2, true)
  logger.logExternalService('payment-gateway', '/charge', 123.4, true)
  
  console.log('✅ Logs estruturados criados')
}

// Exemplo 3: Tracing
async function exemploTracing(tracingService: TracingService) {
  console.log('🔍 Exemplo: Tracing e correlação...')
  
  // Start trace com contexto
  const traceContext = tracingService.startTrace({
    userId: 'user-123',
    companyId: 'company-456',
    tags: { operation: 'process_sale' }
  })
  
  // Simular span de operação
  const span = tracingService.startSpan('validate_payment', {
    paymentMethod: 'credit_card',
    amount: 299.99
  })
  
  // Simular operação
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Log com contexto
  tracingService.logSpanEvent(span, 'Payment validation started', {
    cardLast4: '1234'
  })
  
  // Finalizar span
  tracingService.finishSpan(span, 'finished')
  
  console.log('✅ Trace criado e finalizado')
}

// Exemplo 4: Health Checks
async function exemploHealthChecks(healthCheckService: HealthCheckService) {
  console.log('🏥 Exemplo: Health checks...')
  
  // Adicionar indicador customizado
  healthCheckService.addIndicator({
    name: 'payment_gateway',
    critical: true,
    check: async () => ({
      status: 'healthy' as const,
      message: 'Payment gateway is operational',
      timestamp: new Date()
    })
  })
  
  // Executar health check
  const healthResult = await healthCheckService.performHealthCheck()
  console.log('🏥 Health check result:', healthResult.overall)
  
  console.log('✅ Health checks executados')
}

// Exemplo 5: Resource Monitoring
async function exemploResourceMonitoring(resourceMonitoring: ResourceMonitoringService) {
  console.log('💻 Exemplo: Monitoramento de recursos...')
  
  // Coletar métricas
  const metrics = await resourceMonitoring.collectMetrics()
  console.log('💻 CPU Usage:', metrics.cpu.usage.toFixed(1) + '%')
  console.log('💻 Memory Usage:', ((metrics.memory.used / metrics.memory.total) * 100).toFixed(1) + '%')
  console.log('💻 Disk Usage:', metrics.disk.usagePercent.toFixed(1) + '%')
  
  // Listar alertas ativos
  const activeAlerts = resourceMonitoring.getActiveAlerts()
  console.log('🚨 Alertas ativos:', activeAlerts.length)
  
  console.log('✅ Recursos monitorados')
}

// Exemplo 6: External Services Monitoring
async function exemploExternalMonitoring(externalMonitoring: ExternalServicesMonitoring) {
  console.log('🌐 Exemplo: Monitoramento de serviços externos...')
  
  // Adicionar serviço para monitoramento
  externalMonitoring.addService({
    name: 'payment-gateway',
    url: 'https://api.pagseguro.com.br/health',
    method: 'GET',
    timeout: 5000,
    expectedStatusCodes: [200],
    expectedResponseTime: 1000,
    critical: true,
    retryAttempts: 3,
    retryDelay: 1000,
    authentication: {
      type: 'api-key',
      credentials: {
        apiKey: 'test-key',
        headerName: 'X-API-Key'
      }
    }
  })
  
  // Executar health check manual
  const healthCheck = await externalMonitoring.checkServiceNow('payment-gateway')
  console.log('🌐 Payment gateway status:', healthCheck.status)
  console.log('🌐 Response time:', healthCheck.responseTime + 'ms')
  
  // Ver métricas
  const metrics = externalMonitoring.getServiceMetrics('payment-gateway')
  if (metrics) {
    console.log('🌐 Availability:', metrics.availability.toFixed(1) + '%')
    console.log('🌐 Average response time:', metrics.averageResponseTime.toFixed(1) + 'ms')
  }
  
  console.log('✅ Serviços externos monitorados')
}

// Exemplo 7: Alerting
async function exemploAlerting(alertingService: AlertingService) {
  console.log('🚨 Exemplo: Sistema de alertas...')
  
  // Adicionar regra de alerta
  alertingService.addAlertRule({
    id: 'high_error_rate',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    type: 'threshold',
    severity: 'warning',
    source: 'metrics',
    metric: 'http_error_rate',
    condition: 'gt',
    threshold: 5,
    duration: 300000, // 5 minutes
    enabled: true,
    tags: { service: 'api', component: 'http' }
  })
  
  // Adicionar canal de notificação
  alertingService.addNotificationChannel({
    type: 'email',
    enabled: true,
    config: {
      email: {
        to: ['admin@eestoque.com'],
        subject: '[ALERT] {{severity}}: {{ruleName}}'
      }
    }
  })
  
  // Trigger manual alert
  await alertingService.triggerAlertManually('high_error_rate', 7.2, {
    errorDetails: 'Simulated high error rate'
  })
  
  // Ver alertas ativos
  const activeAlerts = alertingService.getActiveAlerts()
  console.log('🚨 Alertas ativos:', activeAlerts.length)
  
  // Summary
  const summary = alertingService.getAlertSummary()
  console.log('🚨 Alert summary:', summary)
  
  console.log('✅ Alertas configurados')
}

// Exemplo 8: Health Check Endpoints
async function exemploHealthEndpoints(healthCheckService: HealthCheckService, metricsService: MetricsService) {
  console.log('🔗 Exemplo: Health check endpoints...')
  
  // Configurar endpoints
  const endpoints = new HealthCheckEndpoints(
    healthCheckService,
    metricsService,
    createDefaultLogger(),
    {
      enableDetailedHealth: true,
      enableMetrics: true,
      enableReadiness: true,
      enableLiveness: true
    }
  )
  
  // Simular endpoint calls
  console.log('🔗 Available endpoints:')
  console.log('  GET /health')
  console.log('  GET /health/detailed')
  console.log('  GET /health/ready')
  console.log('  GET /health/live')
  console.log('  GET /metrics')
  console.log('  GET /metrics/json')
  
  // Test health endpoint
  const isHealthy = await healthCheckService.isHealthy()
  console.log('🔗 Service health:', isHealthy ? 'healthy' : 'unhealthy')
  
  console.log('✅ Health endpoints configurados')
}

// 9. Exemplo completo integrado
async function exemploCompleto() {
  console.log('🎯 Exemplo completo de monitoring...')
  
  try {
    // Inicializar todos os serviços
    const services = await initializeMonitoring()
    const { 
      logger, 
      metricsService, 
      healthCheckService, 
      tracingService, 
      resourceMonitoring,
      externalMonitoring,
      alertingService 
    } = services
    
    // Demonstrar uso integrado
    await exemploMetrics(metricsService)
    await exemploLogging(logger)
    await exemploTracing(tracingService)
    await exemploHealthChecks(healthCheckService)
    await exemploResourceMonitoring(resourceMonitoring)
    await exemploExternalMonitoring(externalMonitoring)
    await exemploAlerting(alertingService)
    await exemploHealthEndpoints(healthCheckService, metricsService)
    
    // Ver saúde geral do sistema
    console.log('\n📊 Status Geral do Sistema:')
    
    const healthStatus = await healthCheckService.performHealthCheck()
    console.log('🏥 Overall Health:', healthStatus.overall)
    
    const metrics = await metricsService.getMetricsJSON()
    console.log('📊 Metrics collected:', Object.keys(metrics.business || {}).length, 'business metrics')
    
    const alerts = alertingService.getAlertSummary()
    console.log('🚨 Active Alerts:', alerts.triggered)
    
    const resources = resourceMonitoring.getCurrentMetrics()
    if (resources) {
      console.log('💻 CPU Usage:', resources.cpu.usage.toFixed(1) + '%')
      console.log('💻 Memory Usage:', ((resources.memory.used / resources.memory.total) * 100).toFixed(1) + '%')
    }
    
    console.log('✅ Exemplo completo executado com sucesso!')
    
    // Graceful shutdown would go here
    
  } catch (error) {
    console.error('❌ Erro no exemplo completo:', error)
  }
}

// 10. Middleware para Express
function createMonitoringMiddleware(services: any) {
  const { tracingService, logger, metricsService } = services
  
  return {
    // Tracing middleware
    tracing: tracingService.createExpressMiddleware(),
    
    // Health check middleware
    health: (req: any, res: any, next: any) => {
      const startTime = Date.now()
      
      res.on('finish', () => {
        const duration = Date.now() - startTime
        metricsService.recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration)
      })
      
      next()
    },
    
    // Performance middleware
    performance: (operationName: string) => {
      return (req: any, res: any, next: any) => {
        const startTime = Date.now()
        
        res.on('finish', () => {
          const duration = Date.now() - startTime
          logger.logPerformance(operationName, duration, {
            correlationId: req.id,
            method: req.method,
            route: req.route?.path,
            statusCode: res.statusCode
          })
        })
        
        next()
      }
    }
  }
}

// Exportar para uso
export {
  initializeMonitoring,
  createMonitoringMiddleware,
  exemploMetrics,
  exemploLogging,
  exemploTracing,
  exemploHealthChecks,
  exemploResourceMonitoring,
  exemploExternalMonitoring,
  exemploAlerting,
  exemploHealthEndpoints,
  exemploCompleto
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
  exemploCompleto().catch(console.error)
}