import RedisClient from '@shared/redis/RedisClient'
import { EventEmitter } from 'events'

export interface CacheConfig {
  defaultTTL: number
  contextConfigs: {
    [contextName: string]: {
      ttl: number
      prefix: string
      strategies: CacheStrategy[]
    }
  }
}

export interface CacheStrategy {
  name: string
  type: 'cache-aside' | 'write-through' | 'write-behind' | 'refresh-ahead'
  ttl?: number
  conditions?: Record<string, any>
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl: number
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  hitRate?: number
}

export interface CacheStatistics {
  hits: number
  misses: number
  hitRate: number
  sets: number
  deletes: number
  evictions: number
  memoryUsage: number
  keyCount: number
}

export interface CacheInvalidationRule {
  pattern: string
  reason: string
  batchSize?: number
  delay?: number
}

class CacheService extends EventEmitter {
  private redis: RedisClient
  private config: CacheConfig
  private stats: CacheStatistics
  private contextStats: Map<string, CacheStatistics> = new Map()

  constructor(redis: RedisClient, config: CacheConfig) {
    super()
    this.redis = redis
    this.config = {
      defaultTTL: 3600, // 1 hour
      ...config
    }
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
      keyCount: 0
    }
  }

  // Generic cache operations
  async get<T>(key: string, context?: string): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key, context)
      const value = await this.redis.get(cacheKey)
      
      if (value) {
        this.stats.hits++
        this.updateContextStats(context, 'hits')
        await this.updateAccessStats(cacheKey)
        
        // Log cache hit
        this.emit('cacheHit', { key: cacheKey, context })
        return JSON.parse(value)
      } else {
        this.stats.misses++
        this.updateContextStats(context, 'misses')
        
        // Log cache miss
        this.emit('cacheMiss', { key: cacheKey, context })
        return null
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      this.emit('cacheError', { operation: 'get', key, error })
      return null
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl?: number, 
    context?: string,
    strategy: CacheStrategy['type'] = 'cache-aside'
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, context)
      const actualTTL = ttl || this.getTTLForContext(context)
      const serializedValue = JSON.stringify(value)
      
      if (strategy === 'write-through' || strategy === 'write-behind') {
        // For write-through/behind, we might want to store additional metadata
        const cacheEntry: CacheEntry<T> = {
          key: cacheKey,
          value,
          ttl: actualTTL,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0
        }
        await this.redis.setex(cacheKey, actualTTL, JSON.stringify(cacheEntry))
      } else {
        await this.redis.setex(cacheKey, actualTTL, serializedValue)
      }
      
      this.stats.sets++
      this.updateContextStats(context, 'sets')
      
      // Update statistics
      await this.updateKeyStatistics(cacheKey)
      
      // Log cache set
      this.emit('cacheSet', { key: cacheKey, context, ttl: actualTTL, strategy })
      
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      this.emit('cacheError', { operation: 'set', key, error })
      return false
    }
  }

  async delete(key: string, context?: string): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, context)
      const result = await this.redis.del(cacheKey)
      
      if (result > 0) {
        this.stats.deletes++
        this.updateContextStats(context, 'deletes')
        this.emit('cacheDelete', { key: cacheKey, context })
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  }

  async exists(key: string, context?: string): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, context)
      return await this.redis.exists(cacheKey)
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // Batch operations
  async mget<T>(keys: string[], context?: string): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.buildCacheKey(key, context))
      const values = await Promise.all(
        cacheKeys.map(async (cacheKey, index) => {
          const value = await this.redis.get(cacheKey)
          if (value) {
            this.stats.hits++
            this.updateContextStats(context, 'hits')
            return JSON.parse(value)
          } else {
            this.stats.misses++
            this.updateContextStats(context, 'misses')
            return null
          }
        })
      )
      
      return values
    } catch (error) {
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>, context?: string): Promise<boolean> {
    try {
      for (const { key, value, ttl } of entries) {
        await this.set(key, value, ttl, context)
      }
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  }

  // Pattern-based operations
  async deleteByPattern(pattern: string, context?: string): Promise<number> {
    try {
      const fullPattern = this.buildCacheKey(pattern, context)
      const keys = await this.redis.keys(fullPattern)
      
      if (keys.length === 0) {
        return 0
      }
      
      const deletedCount = await this.redis.del(...keys)
      this.stats.deletes += deletedCount
      this.updateContextStats(context, 'deletes', deletedCount)
      
      this.emit('cacheInvalidatePattern', { pattern: fullPattern, deletedCount })
      
      return deletedCount
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error)
      return 0
    }
  }

  // Context-specific methods
  async getWithContext<T>(key: string, context: string, fallback?: () => Promise<T>): Promise<T | null> {
    // Try to get from cache first
    let value = await this.get<T>(key, context)
    
    if (value === null && fallback) {
      // Cache miss - call fallback function
      value = await fallback()
      
      if (value !== null && value !== undefined) {
        // Store in cache for next time
        await this.set(key, value, undefined, context)
      }
    }
    
    return value
  }

  // Invalidation strategies
  async invalidateByRules(rules: CacheInvalidationRule[]): Promise<void> {
    for (const rule of rules) {
      try {
        const deletedCount = await this.deleteByPattern(rule.pattern)
        
        if (rule.delay) {
          await new Promise(resolve => setTimeout(resolve, rule.delay))
        }
        
        console.log(`🔄 Invalidated ${deletedCount} keys matching pattern: ${rule.pattern}`)
      } catch (error) {
        console.error(`Error applying invalidation rule ${rule.pattern}:`, error)
      }
    }
  }

  // Cache warming
  async warmContext(context: string, keys: Array<{ key: string; loader: () => Promise<any> }>): Promise<void> {
    console.log(`🔥 Warming cache for context: ${context}`)
    
    for (const { key, loader } of keys) {
      try {
        // Check if already cached
        const cached = await this.exists(key, context)
        
        if (!cached) {
          const value = await loader()
          if (value) {
            await this.set(key, value, undefined, context)
            console.log(`✅ Warmed cache: ${key}`)
          }
        }
      } catch (error) {
        console.error(`Error warming cache for key ${key}:`, error)
      }
    }
  }

  // Statistics and monitoring
  async getStatistics(): Promise<CacheStatistics> {
    try {
      // Update memory usage and key count
      const info = await this.redis.info('memory')
      const memoryMatch = info.match(/used_memory:(\d+)/)
      const keyspaceInfo = await this.redis.info('keyspace')
      
      this.stats.memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0
      this.stats.keyCount = await this.redis.dbSize()
      this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0
      
      return { ...this.stats }
    } catch (error) {
      console.error('Error getting cache statistics:', error)
      return this.stats
    }
  }

  async getContextStatistics(context: string): Promise<CacheStatistics | null> {
    return this.contextStats.get(context) || null
  }

  async getAllContextStatistics(): Promise<Record<string, CacheStatistics>> {
    const result: Record<string, CacheStatistics> = {}
    
    for (const [context, stats] of this.contextStats) {
      result[context] = stats
    }
    
    return result
  }

  // Cache health checks
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      return false
    }
  }

  // Maintenance operations
  async cleanup(): Promise<void> {
    try {
      // Clean up statistics for contexts that haven't been used recently
      const now = Date.now()
      const contextsToClean = Array.from(this.contextStats.keys())
      
      for (const context of contextsToClean) {
        const stats = this.contextStats.get(context)
        if (stats && now - (stats as any).lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
          this.contextStats.delete(context)
        }
      }
      
      console.log('🧹 Cache cleanup completed')
    } catch (error) {
      console.error('Error during cache cleanup:', error)
    }
  }

  // Utility methods
  private buildCacheKey(key: string, context?: string): string {
    if (context && this.config.contextConfigs[context]) {
      const { prefix } = this.config.contextConfigs[context]
      return `${prefix}${key}`
    }
    return `cache:${key}`
  }

  private getTTLForContext(context?: string): number {
    if (context && this.config.contextConfigs[context]) {
      return this.config.contextConfigs[context].ttl
    }
    return this.config.defaultTTL
  }

  private async updateAccessStats(cacheKey: string): Promise<void> {
    try {
      const accessKey = `stats:access:${cacheKey}`
      await this.redis.incr(accessKey)
      await this.redis.expire(accessKey, 24 * 60 * 60) // 24 hours
    } catch (error) {
      console.warn('Failed to update access stats:', error)
    }
  }

  private async updateKeyStatistics(cacheKey: string): Promise<void> {
    try {
      // This could track additional metrics per key
      const statsKey = `stats:key:${cacheKey}`
      await this.redis.hincrby(statsKey, 'sets', 1)
      await this.redis.expire(statsKey, 7 * 24 * 60 * 60) // 7 days
    } catch (error) {
      console.warn('Failed to update key statistics:', error)
    }
  }

  private updateContextStats(context?: string, operation?: string, increment: number = 1): void {
    if (!context) return
    
    if (!this.contextStats.has(context)) {
      this.contextStats.set(context, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        memoryUsage: 0,
        keyCount: 0
      })
    }
    
    const stats = this.contextStats.get(context)!
    
    if (operation && stats.hasOwnProperty(operation)) {
      (stats as any)[operation] += increment
      stats.hitRate = stats.hits + stats.misses > 0 
        ? stats.hits / (stats.hits + stats.misses) 
        : 0
    }
    
    (stats as any).lastActivity = Date.now()
  }
}

export default CacheService