import { EventEmitter } from 'events'
import RedisClient from '@shared/redis/RedisClient'
import { LoggerService } from './LoggerService'

export interface AlertRule {
  id: string
  name: string
  description: string
  type: 'threshold' | 'rate' | 'anomaly' | 'custom'
  severity: 'info' | 'warning' | 'critical'
  source: 'metrics' | 'health' | 'resources' | 'external' | 'business'
  metric: string
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'between' | 'outside'
  threshold: number | [number, number]
  duration: number // Time in milliseconds the condition must be true
  enabled: boolean
  tags: Record<string, string>
  metadata?: Record<string, any>
}

export interface AlertNotification {
  id: string
  alertRuleId: string
  ruleName: string
  severity: AlertRule['severity']
  source: AlertRule['source']
  message: string
  value: number
  threshold: number | [number, number]
  condition: AlertRule['condition']
  timestamp: Date
  status: 'triggered' | 'resolved' | 'acknowledged'
  resolvedAt?: Date
  acknowledgedBy?: string
  acknowledgedAt?: Date
  tags: Record<string, string>
  metadata?: Record<string, any>
  notificationsSent: NotificationChannel[]
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  enabled: boolean
  config: {
    email?: {
      to: string[]
      cc?: string[]
      subject: string
      template?: string
    }
    slack?: {
      webhookUrl: string
      channel: string
      username: string
      icon?: string
    }
    webhook?: {
      url: string
      method: 'POST' | 'PUT' | 'PATCH'
      headers?: Record<string, string>
      body?: any
    }
    sms?: {
      provider: 'twilio' | 'aws-sns'
      to: string[]
      from?: string
    }
  }
}

export interface AlertSummary {
  total: number
  triggered: number
  resolved: number
  acknowledged: number
  critical: number
  warning: number
  info: number
  bySource: Record<string, number>
  bySeverity: Record<string, number>
}

class AlertingService extends EventEmitter {
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, AlertNotification> = new Map()
  private alertHistory: AlertNotification[] = []
  private notificationChannels: Map<string, NotificationChannel> = new Map()
  private logger: LoggerService
  private redis?: RedisClient
  private alertEvaluationInterval: NodeJS.Timeout | null = null
  private notificationQueue: AlertNotification[] = []

  constructor(logger: LoggerService, redis?: RedisClient) {
    super()
    this.logger = logger.createChildLogger({ component: 'alerting' })
    this.redis = redis
  }

  // Alert Rules Management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
    this.logger.info('Alert rule added', {
      ruleId: rule.id,
      name: rule.name,
      severity: rule.severity,
      source: rule.source
    })
    this.emit('ruleAdded', rule)
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const existingRule = this.alertRules.get(ruleId)
    if (!existingRule) {
      return false
    }

    const updatedRule = { ...existingRule, ...updates }
    this.alertRules.set(ruleId, updatedRule)
    
    this.logger.info('Alert rule updated', { ruleId, updates })
    this.emit('ruleUpdated', updatedRule)
    
    return true
  }

  deleteAlertRule(ruleId: string): boolean {
    const deleted = this.alertRules.delete(ruleId)
    if (deleted) {
      this.logger.info('Alert rule deleted', { ruleId })
      this.emit('ruleDeleted', ruleId)
    }
    return deleted
  }

  getAlertRule(ruleId: string): AlertRule | null {
    return this.alertRules.get(ruleId) || null
  }

  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  // Notification Channels Management
  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.type, channel)
    this.logger.info('Notification channel added', { 
      type: channel.type, 
      enabled: channel.enabled 
    })
  }

  updateNotificationChannel(type: NotificationChannel['type'], updates: Partial<NotificationChannel>): boolean {
    const existingChannel = this.notificationChannels.get(type)
    if (!existingChannel) {
      return false
    }

    const updatedChannel = { ...existingChannel, ...updates }
    this.notificationChannels.set(type, updatedChannel)
    
    this.logger.info('Notification channel updated', { type, updates })
    this.emit('channelUpdated', updatedChannel)
    
    return true
  }

  deleteNotificationChannel(type: NotificationChannel['type']): boolean {
    const deleted = this.notificationChannels.delete(type)
    if (deleted) {
      this.logger.info('Notification channel deleted', { type })
      this.emit('channelDeleted', type)
    }
    return deleted
  }

  getNotificationChannel(type: NotificationChannel['type']): NotificationChannel | null {
    return this.notificationChannels.get(type) || null
  }

  getAllNotificationChannels(): NotificationChannel[] {
    return Array.from(this.notificationChannels.values())
  }

  // Alert Processing
  startAlertEvaluation(): void {
    if (this.alertEvaluationInterval) {
      return
    }

    this.logger.info('Starting alert evaluation')
    this.alertEvaluationInterval = setInterval(async () => {
      try {
        await this.evaluateAllRules()
      } catch (error) {
        this.logger.error('Failed to evaluate alert rules', error)
      }
    }, 30000) // Every 30 seconds

    // Process notification queue
    this.processNotificationQueue()
  }

  stopAlertEvaluation(): void {
    if (!this.alertEvaluationInterval) {
      return
    }

    clearInterval(this.alertEvaluationInterval)
    this.alertEvaluationInterval = null
    
    this.logger.info('Alert evaluation stopped')
  }

  private async evaluateAllRules(): Promise<void> {
    const enabledRules = Array.from(this.alertRules.values()).filter(rule => rule.enabled)
    
    for (const rule of enabledRules) {
      try {
        await this.evaluateRule(rule)
      } catch (error) {
        this.logger.error(`Failed to evaluate rule ${rule.id}`, error)
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    const currentValue = await this.getMetricValue(rule.source, rule.metric)
    
    if (currentValue === null || currentValue === undefined) {
      this.logger.debug('No data available for rule evaluation', {
        ruleId: rule.id,
        source: rule.source,
        metric: rule.metric
      })
      return
    }

    const isTriggered = this.evaluateCondition(currentValue, rule.condition, rule.threshold)
    const alertKey = `${rule.id}`
    const existingAlert = this.activeAlerts.get(alertKey)

    if (isTriggered) {
      if (!existingAlert || existingAlert.status === 'resolved') {
        // Trigger new alert
        const alert = this.createAlert(rule, currentValue)
        await this.triggerAlert(alert)
      } else {
        // Update existing alert
        await this.updateAlert(existingAlert, currentValue)
      }
    } else {
      if (existingAlert && existingAlert.status === 'triggered') {
        // Resolve alert
        await this.resolveAlert(existingAlert)
      }
    }
  }

  private evaluateCondition(value: number, condition: AlertRule['condition'], threshold: number | [number, number]): boolean {
    switch (condition) {
      case 'gt':
        return value > (threshold as number)
      case 'gte':
        return value >= (threshold as number)
      case 'lt':
        return value < (threshold as number)
      case 'lte':
        return value <= (threshold as number)
      case 'eq':
        return value === (threshold as number)
      case 'ne':
        return value !== (threshold as number)
      case 'between':
        const [min, max] = threshold as [number, number]
        return value >= min && value <= max
      case 'outside':
        const [min2, max2] = threshold as [number, number]
        return value < min2 || value > max2
      default:
        return false
    }
  }

  private async getMetricValue(source: AlertRule['source'], metric: string): Promise<number | null> {
    try {
      // This would integrate with your actual metrics services
      // For now, return mock data based on source
      switch (source) {
        case 'resources':
          return this.getResourceMetric(metric)
        case 'health':
          return this.getHealthMetric(metric)
        case 'external':
          return this.getExternalServiceMetric(metric)
        case 'metrics':
          return this.getCustomMetric(metric)
        default:
          return null
      }
    } catch (error) {
      this.logger.warn('Failed to get metric value', { source, metric, error })
      return null
    }
  }

  private getResourceMetric(metric: string): number {
    // Mock implementation - in real scenario, this would get from ResourceMonitoringService
    const mockMetrics: Record<string, number> = {
      'cpu_usage': Math.random() * 100,
      'memory_usage': Math.random() * 100,
      'disk_usage': Math.random() * 100,
      'event_loop_delay': Math.random() * 200
    }
    return mockMetrics[metric] || 0
  }

  private getHealthMetric(metric: string): number {
    // Mock implementation - in real scenario, this would get from HealthCheckService
    return Math.random() * 100
  }

  private getExternalServiceMetric(metric: string): number {
    // Mock implementation - in real scenario, this would get from ExternalServicesMonitoring
    return Math.random() * 100
  }

  private getCustomMetric(metric: string): number {
    // Mock implementation - in real scenario, this would get from MetricsService
    return Math.random() * 100
  }

  private createAlert(rule: AlertRule, currentValue: number): AlertNotification {
    const alert: AlertNotification = {
      id: this.generateAlertId(),
      alertRuleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      source: rule.source,
      message: this.generateAlertMessage(rule, currentValue),
      value: currentValue,
      threshold: rule.threshold,
      condition: rule.condition,
      timestamp: new Date(),
      status: 'triggered',
      tags: { ...rule.tags },
      metadata: {
        ...rule.metadata,
        evaluationTime: new Date().toISOString()
      },
      notificationsSent: []
    }

    return alert
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    const conditionSymbol = this.getConditionSymbol(rule.condition)
    const thresholdStr = Array.isArray(rule.threshold) 
      ? rule.threshold.join(' and ') 
      : rule.threshold.toString()

    return `[${rule.severity.toUpperCase()}] ${rule.name}: ${value} ${conditionSymbol} ${thresholdStr}`
  }

  private getConditionSymbol(condition: AlertRule['condition']): string {
    const symbols: Record<AlertRule['condition'], string> = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      eq: '==',
      ne: '!=',
      between: 'between',
      outside: 'outside'
    }
    return symbols[condition] || condition
  }

  private async triggerAlert(alert: AlertNotification): Promise<void> {
    this.activeAlerts.set(`${alert.alertRuleId}`, alert)
    this.alertHistory.push(alert)

    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleId: alert.alertRuleId,
      severity: alert.severity,
      message: alert.message
    })

    this.emit('alertTriggered', alert)

    // Queue for notification
    this.notificationQueue.push(alert)
    
    // Store in Redis
    if (this.redis) {
      await this.storeAlertInRedis(alert)
    }
  }

  private async updateAlert(alert: AlertNotification, newValue: number): Promise<void> {
    alert.value = newValue
    alert.metadata = {
      ...alert.metadata,
      lastUpdate: new Date().toISOString(),
      lastValue: newValue
    }

    this.logger.info('Alert updated', {
      alertId: alert.id,
      newValue,
      threshold: alert.threshold
    })

    this.emit('alertUpdated', alert)
  }

  private async resolveAlert(alert: AlertNotification): Promise<void> {
    alert.status = 'resolved'
    alert.resolvedAt = new Date()

    this.logger.info('Alert resolved', {
      alertId: alert.id,
      ruleId: alert.alertRuleId,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
    })

    this.emit('alertResolved', alert)

    // Move to history (already done) and remove from active
    this.activeAlerts.delete(`${alert.alertRuleId}`)
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) {
      return
    }

    const alert = this.notificationQueue.shift()!
    await this.sendNotifications(alert)
    
    // Process next alert in queue
    if (this.notificationQueue.length > 0) {
      setTimeout(() => this.processNotificationQueue(), 1000)
    }
  }

  private async sendNotifications(alert: AlertNotification): Promise<void> {
    const enabledChannels = Array.from(this.notificationChannels.values())
      .filter(channel => channel.enabled)

    for (const channel of enabledChannels) {
      try {
        await this.sendNotification(channel, alert)
        alert.notificationsSent.push(channel)
        this.logger.info('Notification sent', {
          alertId: alert.id,
          channelType: channel.type
        })
      } catch (error) {
        this.logger.error('Failed to send notification', {
          alertId: alert.id,
          channelType: channel.type,
          error
        })
      }
    }

    this.emit('notificationsSent', alert)
  }

  private async sendNotification(channel: NotificationChannel, alert: AlertNotification): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel.config.email!, alert)
        break
      case 'slack':
        await this.sendSlackNotification(channel.config.slack!, alert)
        break
      case 'webhook':
        await this.sendWebhookNotification(channel.config.webhook!, alert)
        break
      case 'sms':
        await this.sendSMSNotification(channel.config.sms!, alert)
        break
    }
  }

  private async sendEmailNotification(config: NotificationChannel['config']['email'], alert: AlertNotification): Promise<void> {
    // Mock implementation - in real scenario, would integrate with EmailService
    this.logger.info('Email notification (mock)', {
      to: config?.to,
      subject: config?.subject || `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
      message: alert.message
    })
  }

  private async sendSlackNotification(config: NotificationChannel['config']['slack'], alert: AlertNotification): Promise<void> {
    // Mock implementation - in real scenario, would send to Slack webhook
    this.logger.info('Slack notification (mock)', {
      channel: config?.channel,
      message: alert.message
    })
  }

  private async sendWebhookNotification(config: NotificationChannel['config']['webhook'], alert: AlertNotification): Promise<void> {
    // Mock implementation - in real scenario, would make HTTP request
    this.logger.info('Webhook notification (mock)', {
      url: config?.url,
      method: config?.method,
      body: {
        alertId: alert.id,
        ruleName: alert.ruleName,
        severity: alert.severity,
        message: alert.message,
        value: alert.value,
        timestamp: alert.timestamp
      }
    })
  }

  private async sendSMSNotification(config: NotificationChannel['config']['sms'], alert: AlertNotification): Promise<void> {
    // Mock implementation - in real scenario, would integrate with SMS provider
    this.logger.info('SMS notification (mock)', {
      to: config?.to,
      message: `[${alert.severity.toUpperCase()}] ${alert.ruleName}: ${alert.message}`
    })
  }

  // Manual Alert Management
  async triggerAlertManually(ruleId: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const rule = this.alertRules.get(ruleId)
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`)
    }

    const alert = this.createAlert(rule, value)
    alert.metadata = { ...alert.metadata, ...metadata, manual: true }
    await this.triggerAlert(alert)
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId) || this.alertHistory.find(a => a.id === alertId)
    if (alert && alert.status === 'triggered') {
      alert.status = 'acknowledged'
      alert.acknowledgedBy = acknowledgedBy
      alert.acknowledgedAt = new Date()

      this.logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy
      })

      this.emit('alertAcknowledged', alert)
      return true
    }
    return false
  }

  // Data Retrieval
  getActiveAlerts(): AlertNotification[] {
    return Array.from(this.activeAlerts.values())
  }

  getAlertHistory(limit?: number): AlertNotification[] {
    const history = [...this.alertHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? history.slice(0, limit) : history
  }

  getAlertSummary(): AlertSummary {
    const active = this.getActiveAlerts()
    const history = this.getAlertHistory()
    const allAlerts = [...active, ...history]

    const summary: AlertSummary = {
      total: allAlerts.length,
      triggered: allAlerts.filter(a => a.status === 'triggered').length,
      resolved: allAlerts.filter(a => a.status === 'resolved').length,
      acknowledged: allAlerts.filter(a => a.status === 'acknowledged').length,
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      warning: allAlerts.filter(a => a.severity === 'warning').length,
      info: allAlerts.filter(a => a.severity === 'info').length,
      bySource: {},
      bySeverity: {}
    }

    // Count by source
    for (const alert of allAlerts) {
      summary.bySource[alert.source] = (summary.bySource[alert.source] || 0) + 1
      summary.bySeverity[alert.severity] = (summary.bySeverity[alert.severity] || 0) + 1
    }

    return summary
  }

  // Utility Methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async storeAlertInRedis(alert: AlertNotification): Promise<void> {
    try {
      const key = `alert:${alert.id}`
      await this.redis.setex(key, 30 * 24 * 3600, JSON.stringify(alert)) // 30 days retention
    } catch (error) {
      this.logger.warn('Failed to store alert in Redis', { error, alertId: alert.id })
    }
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      // Basic health check
      return this.alertRules.size >= 0 && this.notificationChannels.size >= 0
    } catch (error) {
      return false
    }
  }
}

export default AlertingService