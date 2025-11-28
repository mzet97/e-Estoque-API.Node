import { EventEmitter } from 'events'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import RedisClient from '@shared/redis/RedisClient'
import { LoggerService } from './LoggerService'

const execAsync = promisify(exec)

export interface ResourceMonitoringConfig {
  enableCpuMonitoring: boolean
  enableMemoryMonitoring: boolean
  enableDiskMonitoring: boolean
  enableNetworkMonitoring: boolean
  enableProcessMonitoring: boolean
  collectionInterval: number
  retentionPeriod: number
  alertThresholds: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    responseTime: number
    eventLoopDelay: number
  }
  enableAlerts: boolean
  redisStorage?: RedisClient
}

export interface SystemResourceMetrics {
  timestamp: Date
  cpu: {
    usage: number
    loadAverage: number[]
    cores: number
    processes: number
  }
  memory: {
    used: number
    total: number
    free: number
    available: number
    buffers: number
    cached: number
    swapUsed: number
    swapTotal: number
  }
  disk: {
    used: number
    total: number
    free: number
    usagePercent: number
    ioRead: number
    ioWrite: number
  }
  network: {
    bytesReceived: number
    bytesSent: number
    packetsReceived: number
    packetsSent: number
    errorsIn: number
    errorsOut: number
  }
  process: {
    pid: number
    uptime: number
    memoryUsed: number
    cpuUsage: number
    handles: number
    threads: number
    eventLoopDelay: number
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
}

export interface ResourceAlert {
  id: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'process'
  severity: 'warning' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: Date
  resolved: boolean
  details?: Record<string, any>
}

export interface HistoricalResourceData {
  timestamp: Date
  cpu: number
  memory: number
  disk: number
  responseTime: number
}

class ResourceMonitoringService extends EventEmitter {
  private config: ResourceMonitoringConfig
  private logger: LoggerService
  private redis?: RedisClient
  private currentMetrics: SystemResourceMetrics | null = null
  private alertHistory: ResourceAlert[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private historicalData: HistoricalResourceData[] = []

  constructor(
    config: ResourceMonitoringConfig, 
    logger: LoggerService, 
    redis?: RedisClient
  ) {
    super()
    this.config = {
      enableCpuMonitoring: true,
      enableMemoryMonitoring: true,
      enableDiskMonitoring: true,
      enableNetworkMonitoring: false,
      enableProcessMonitoring: true,
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        responseTime: 1000,
        eventLoopDelay: 100
      },
      enableAlerts: true,
      ...config
    }
    
    this.logger = logger.createChildLogger({ component: 'resource-monitoring' })
    this.redis = redis || config.redisStorage

    // Set up alert cleanup
    this.setupAlertCleanup()
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return
    }

    this.isMonitoring = true
    this.logger.info('Starting resource monitoring', {
      interval: this.config.collectionInterval,
      alerts: this.config.enableAlerts
    })

    // Perform initial collection
    await this.collectMetrics()

    // Set up periodic collection
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        this.logger.error('Failed to collect resource metrics', error)
      }
    }, this.config.collectionInterval)

    this.emit('monitoringStarted')
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring || !this.monitoringInterval) {
      return
    }

    this.isMonitoring = false
    clearInterval(this.monitoringInterval)
    this.monitoringInterval = null

    this.logger.info('Resource monitoring stopped')
    this.emit('monitoringStopped')
  }

  async collectMetrics(): Promise<SystemResourceMetrics> {
    const timestamp = new Date()

    try {
      const metrics: SystemResourceMetrics = {
        timestamp,
        cpu: await this.collectCpuMetrics(),
        memory: await this.collectMemoryMetrics(),
        disk: await this.collectDiskMetrics(),
        network: this.config.enableNetworkMonitoring ? await this.collectNetworkMetrics() : this.getEmptyNetworkMetrics(),
        process: await this.collectProcessMetrics()
      }

      this.currentMetrics = metrics
      await this.processMetrics(metrics)
      this.emit('metricsCollected', metrics)

      return metrics
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error)
      throw error
    }
  }

  private async collectCpuMetrics(): Promise<SystemResourceMetrics['cpu']> {
    const [usage, loadAvg, coreCount] = await Promise.all([
      this.getCpuUsage(),
      this.getLoadAverage(),
      this.getCpuCoreCount()
    ])

    // Get process count
    let processes = 0
    try {
      const { stdout } = await execAsync('ps aux | wc -l')
      processes = parseInt(stdout.trim()) - 1 // Subtract header line
    } catch (error) {
      this.logger.warn('Failed to get process count', { error })
    }

    return {
      usage,
      loadAverage: loadAvg,
      cores: coreCount,
      processes
    }
  }

  private async collectMemoryMetrics(): Promise<SystemResourceMetrics['memory']> {
    try {
      const memInfo = await fs.readFile('/proc/meminfo', 'utf-8')
      const lines = memInfo.split('\n')
      
      const getValue = (name: string): number => {
        const line = lines.find(l => l.startsWith(name))
        return line ? parseInt(line.split(':')[1].trim()) * 1024 : 0 // Convert KB to bytes
      }

      const total = getValue('MemTotal')
      const free = getValue('MemFree')
      const available = getValue('MemAvailable')
      const buffers = getValue('Buffers')
      const cached = getValue('Cached')
      const swapTotal = getValue('SwapTotal')
      const swapFree = getValue('SwapFree')
      const swapUsed = swapTotal - swapFree

      return {
        used: total - free,
        total,
        free,
        available,
        buffers,
        cached,
        swapUsed,
        swapTotal
      }
    } catch (error) {
      this.logger.warn('Failed to read memory info', { error })
      
      // Fallback to process memory info
      const processMem = process.memoryUsage()
      return {
        used: processMem.rss,
        total: processMem.rss, // Not accurate, but better than nothing
        free: 0,
        available: 0,
        buffers: 0,
        cached: 0,
        swapUsed: 0,
        swapTotal: 0
      }
    }
  }

  private async collectDiskMetrics(): Promise<SystemResourceMetrics['disk']> {
    try {
      // Use df to get disk usage
      const { stdout } = await execAsync('df -k / | tail -1')
      const parts = stdout.trim().split(/\s+/)
      
      const total = parseInt(parts[1]) * 1024 // Convert KB to bytes
      const used = parseInt(parts[2]) * 1024
      const free = parseInt(parts[3]) * 1024
      const usagePercent = parseInt(parts[4])

      // Get disk I/O stats (if available)
      let ioRead = 0
      let ioWrite = 0
      try {
        const { stdout: ioStats } = await execAsync('cat /proc/diskstats | grep -E " (sda|vda|nvme)" | head -1')
        const ioParts = ioStats.trim().split(/\s+/)
        ioRead = parseInt(ioParts[5]) || 0
        ioWrite = parseInt(ioParts[9]) || 0
      } catch (error) {
        this.logger.warn('Failed to get disk I/O stats', { error })
      }

      return {
        used,
        total,
        free,
        usagePercent,
        ioRead,
        ioWrite
      }
    } catch (error) {
      this.logger.warn('Failed to collect disk metrics', { error })
      return this.getEmptyDiskMetrics()
    }
  }

  private async collectNetworkMetrics(): Promise<SystemResourceMetrics['network']> {
    try {
      const { stdout } = await execAsync('cat /proc/net/dev | grep -E "(eth0|ens|wlan)" | head -1')
      const parts = stdout.trim().split(/\s+/)
      
      return {
        bytesReceived: parseInt(parts[1]) || 0,
        bytesSent: parseInt(parts[9]) || 0,
        packetsReceived: parseInt(parts[2]) || 0,
        packetsSent: parseInt(parts[10]) || 0,
        errorsIn: parseInt(parts[3]) || 0,
        errorsOut: parseInt(parts[11]) || 0
      }
    } catch (error) {
      this.logger.warn('Failed to collect network metrics', { error })
      return this.getEmptyNetworkMetrics()
    }
  }

  private async collectProcessMetrics(): Promise<SystemResourceMetrics['process']> {
    const startUsage = process.cpuUsage()
    const startTime = Date.now()
    
    // Busy wait to measure CPU usage
    while (Date.now() - startTime < 100) {
      Math.random() * Math.random()
    }
    
    const endUsage = process.cpuUsage(startUsage)
    const cpuUsage = (endUsage.user + endUsage.system) / 100000 // Convert to percentage

    const processMemory = process.memoryUsage()
    const eventLoopDelay = await this.measureEventLoopDelay()

    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsed: processMemory.rss,
      cpuUsage,
      handles: (process as any)._getActiveHandles?.().length || 0,
      threads: (process as any)._getActiveRequests?.().length || 0,
      eventLoopDelay,
      rss: processMemory.rss,
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      external: processMemory.external
    }
  }

  private async measureEventLoopDelay(): Promise<number> {
    const start = process.hrtime.bigint()
    return new Promise(resolve => {
      setImmediate(() => {
        const delay = Number(process.hrtime.bigint() - start) / 1e6 // Convert to milliseconds
        resolve(delay)
      })
    })
  }

  private async getCpuUsage(): Promise<number> {
    try {
      const startCpuUsage = process.cpuUsage()
      const startTime = Date.now()
      
      // Wait 100ms to measure
      while (Date.now() - startTime < 100) {
        Math.random()
      }
      
      const endCpuUsage = process.cpuUsage(startCpuUsage)
      const cpuPercent = (endCpuUsage.user + endCpuUsage.system) / 100000
      
      return Math.min(cpuPercent, 100)
    } catch (error) {
      this.logger.warn('Failed to get CPU usage', { error })
      return 0
    }
  }

  private async getLoadAverage(): Promise<number[]> {
    try {
      if (process.platform === 'win32') {
        return [0, 0, 0]
      }
      return process.loadavg()
    } catch (error) {
      this.logger.warn('Failed to get load average', { error })
      return [0, 0, 0]
    }
  }

  private async getCpuCoreCount(): Promise<number> {
    try {
      return require('os').cpus().length
    } catch (error) {
      return 1
    }
  }

  private getEmptyNetworkMetrics(): SystemResourceMetrics['network'] {
    return {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      errorsIn: 0,
      errorsOut: 0
    }
  }

  private getEmptyDiskMetrics(): SystemResourceMetrics['disk'] {
    return {
      used: 0,
      total: 0,
      free: 0,
      usagePercent: 0,
      ioRead: 0,
      ioWrite: 0
    }
  }

  private async processMetrics(metrics: SystemResourceMetrics): Promise<void> {
    // Store in memory for quick access
    await this.storeMetricsInMemory(metrics)
    
    // Store in Redis for persistence
    if (this.redis) {
      await this.storeMetricsInRedis(metrics)
    }

    // Check for alerts
    if (this.config.enableAlerts) {
      await this.checkAlerts(metrics)
    }

    // Clean up old historical data
    await this.cleanupHistoricalData()
  }

  private async storeMetricsInMemory(metrics: SystemResourceMetrics): Promise<void> {
    this.currentMetrics = metrics
    
    // Add to historical data
    this.historicalData.push({
      timestamp: metrics.timestamp,
      cpu: metrics.cpu.usage,
      memory: (metrics.memory.used / metrics.memory.total) * 100,
      disk: metrics.disk.usagePercent,
      responseTime: metrics.process.eventLoopDelay
    })

    // Keep only recent data in memory
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    this.historicalData = this.historicalData.filter(d => d.timestamp.getTime() > cutoff)
  }

  private async storeMetricsInRedis(metrics: SystemResourceMetrics): Promise<void> {
    try {
      const key = `resource:metrics:${metrics.timestamp.getTime()}`
      await this.redis.setex(key, this.config.retentionPeriod / 1000, JSON.stringify(metrics))
    } catch (error) {
      this.logger.warn('Failed to store metrics in Redis', { error })
    }
  }

  private async checkAlerts(metrics: SystemResourceMetrics): Promise<void> {
    const alerts: ResourceAlert[] = []

    // CPU usage alert
    if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        id: this.generateAlertId(),
        type: 'cpu',
        severity: metrics.cpu.usage > 90 ? 'critical' : 'warning',
        message: `CPU usage is high: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.config.alertThresholds.cpuUsage,
        timestamp: new Date(),
        resolved: false,
        details: {
          loadAverage: metrics.cpu.loadAverage,
          processes: metrics.cpu.processes
        }
      })
    }

    // Memory usage alert
    const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100
    if (memoryUsagePercent > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        id: this.generateAlertId(),
        type: 'memory',
        severity: memoryUsagePercent > 95 ? 'critical' : 'warning',
        message: `Memory usage is high: ${memoryUsagePercent.toFixed(1)}%`,
        value: memoryUsagePercent,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp: new Date(),
        resolved: false,
        details: {
          used: metrics.memory.used,
          total: metrics.memory.total,
          available: metrics.memory.available,
          swapUsed: metrics.memory.swapUsed
        }
      })
    }

    // Disk usage alert
    if (metrics.disk.usagePercent > this.config.alertThresholds.diskUsage) {
      alerts.push({
        id: this.generateAlertId(),
        type: 'disk',
        severity: metrics.disk.usagePercent > 95 ? 'critical' : 'warning',
        message: `Disk usage is high: ${metrics.disk.usagePercent}%`,
        value: metrics.disk.usagePercent,
        threshold: this.config.alertThresholds.diskUsage,
        timestamp: new Date(),
        resolved: false,
        details: {
          used: metrics.disk.used,
          total: metrics.disk.total,
          free: metrics.disk.free
        }
      })
    }

    // Event loop delay alert
    if (metrics.process.eventLoopDelay > this.config.alertThresholds.eventLoopDelay) {
      alerts.push({
        id: this.generateAlertId(),
        type: 'process',
        severity: metrics.process.eventLoopDelay > 200 ? 'critical' : 'warning',
        message: `Event loop delay is high: ${metrics.process.eventLoopDelay.toFixed(2)}ms`,
        value: metrics.process.eventLoopDelay,
        threshold: this.config.alertThresholds.eventLoopDelay,
        timestamp: new Date(),
        resolved: false,
        details: {
          cpuUsage: metrics.process.cpuUsage,
          memoryUsed: metrics.process.memoryUsed,
          handles: metrics.process.handles
        }
      })
    }

    // Emit alerts
    for (const alert of alerts) {
      this.alertHistory.push(alert)
      this.emit('alert', alert)
      this.logger.warn('Resource alert triggered', alert)
    }
  }

  private setupAlertCleanup(): void {
    // Clean up old alerts every hour
    setInterval(() => {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
      this.alertHistory = this.alertHistory.filter(alert => 
        alert.timestamp.getTime() > cutoff
      )
    }, 60 * 60 * 1000)
  }

  private async cleanupHistoricalData(): Promise<void> {
    const cutoff = Date.now() - this.config.retentionPeriod
    
    // Clean up memory
    this.historicalData = this.historicalData.filter(d => 
      d.timestamp.getTime() > cutoff
    )

    // Clean up Redis
    if (this.redis) {
      try {
        const pattern = 'resource:metrics:*'
        const keys = await this.redis.keys(pattern)
        const oldKeys = keys.filter(key => {
          const timestamp = parseInt(key.split(':').pop() || '0')
          return timestamp < cutoff
        })
        
        if (oldKeys.length > 0) {
          await this.redis.del(...oldKeys)
        }
      } catch (error) {
        this.logger.warn('Failed to clean up old metrics in Redis', { error })
      }
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public getters
  getCurrentMetrics(): SystemResourceMetrics | null {
    return this.currentMetrics
  }

  getHistoricalData(since?: Date): HistoricalResourceData[] {
    if (!since) {
      return [...this.historicalData]
    }
    
    return this.historicalData.filter(d => d.timestamp >= since)
  }

  getAlertHistory(limit?: number): ResourceAlert[] {
    const alerts = [...this.alertHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? alerts.slice(0, limit) : alerts
  }

  getActiveAlerts(): ResourceAlert[] {
    return this.alertHistory.filter(alert => !alert.resolved)
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      this.emit('alertResolved', alert)
      this.logger.info('Alert resolved', { alertId })
      return true
    }
    return false
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Test if we can collect metrics
      await this.collectMetrics()
      return true
    } catch (error) {
      return false
    }
  }
}

export default ResourceMonitoringService