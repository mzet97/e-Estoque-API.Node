import { createClient, RedisClientType, RedisModules, RedisFunctions } from 'redis'
import { EventEmitter } from 'events'

export interface RedisConfig {
  host?: string
  port?: number
  password?: string
  database?: number
  keyPrefix?: string
  retryDelayOnFailover?: number
  retryDelayOnClusterDown?: number
  maxRetriesPerRequest?: number
  lazyConnect?: boolean
  retryDelayOnNewOrleans?: number
}

class RedisClient extends EventEmitter {
  private static instance: RedisClient
  private client: RedisClientType | null = null
  private config: RedisConfig
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  private constructor(config?: Partial<RedisConfig>) {
    super()
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DATABASE || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'eestoque:',
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryDelayOnNewOrleans: 200,
      ...config
    }
  }

  public static getInstance(config?: Partial<RedisConfig>): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config)
    }
    return RedisClient.instance
  }

  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.initializeConnection()
    return this.connectionPromise
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: 60000,
          lazyConnect: this.config.lazyConnect
        },
        password: this.config.password,
        database: this.config.database,
        commandsQueueMaxLength: 1000
      })

      this.client.on('error', (error) => {
        console.error('Redis Client Error:', error)
        this.isConnected = false
        this.emit('error', error)
      })

      this.client.on('connect', () => {
        console.log('Redis Client connected')
        this.isConnected = true
        this.emit('connect')
      })

      this.client.on('ready', () => {
        console.log('Redis Client ready')
        this.emit('ready')
      })

      this.client.on('end', () => {
        console.log('Redis Client disconnected')
        this.isConnected = false
        this.emit('end')
      })

      await this.client.connect()
      
      // Test connection
      await this.client.ping()
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.connectionPromise = null
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.client = null
      this.isConnected = false
      this.connectionPromise = null
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false
      }
      await this.client.ping()
      return true
    } catch (error) {
      return false
    }
  }

  public async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.ensureConnected()
    await this.client!.setEx(key, seconds, value)
  }

  public async setnx(key: string, value: string): Promise<boolean> {
    await this.ensureConnected()
    return await this.client!.setNX(key, value)
  }

  public async set(key: string, value: string): Promise<void> {
    await this.ensureConnected()
    await this.client!.set(key, value)
  }

  public async get(key: string): Promise<string | null> {
    await this.ensureConnected()
    return await this.client!.get(key)
  }

  public async del(key: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.del(key)
  }

  public async exists(key: string): Promise<boolean> {
    await this.ensureConnected()
    const result = await this.client!.exists(key)
    return result === 1
  }

  public async incr(key: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.incr(key)
  }

  public async incrby(key: string, increment: number): Promise<number> {
    await this.ensureConnected()
    return await this.client!.incrBy(key, increment)
  }

  public async incrbyfloat(key: string, increment: number): Promise<number> {
    await this.ensureConnected()
    return await this.client!.incrByFloat(key, increment)
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    await this.ensureConnected()
    return (await this.client!.expire(key, seconds)) === 1
  }

  public async ttl(key: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.ttl(key)
  }

  public async keys(pattern: string): Promise<string[]> {
    await this.ensureConnected()
    return await this.client!.keys(pattern)
  }

  public async hset(key: string, field: string, value: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.hSet(key, field, value)
  }

  public async hget(key: string, field: string): Promise<string | null> {
    await this.ensureConnected()
    return await this.client!.hGet(key, field)
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    await this.ensureConnected()
    return await this.client!.hGetAll(key)
  }

  public async hdel(key: string, field: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.hDel(key, field)
  }

  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    await this.ensureConnected()
    return await this.client!.hIncrBy(key, field, increment)
  }

  public async hincrbyfloat(key: string, field: string, increment: number): Promise<number> {
    await this.ensureConnected()
    return await this.client!.hIncrByFloat(key, field, increment)
  }

  public async hkeys(key: string): Promise<string[]> {
    await this.ensureConnected()
    return await this.client!.hKeys(key)
  }

  public async hvals(key: string): Promise<string[]> {
    await this.ensureConnected()
    return await this.client!.hVals(key)
  }

  public async hlen(key: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.hLen(key)
  }

  public async lpush(key: string, element: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.lPush(key, element)
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.ensureConnected()
    return await this.client!.lRange(key, start, stop)
  }

  public async llen(key: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.lLen(key)
  }

  public async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.ensureConnected()
    await this.client!.lTrim(key, start, stop)
  }

  public async rpop(key: string): Promise<string | null> {
    await this.ensureConnected()
    return await this.client!.rPop(key)
  }

  public async sadd(key: string, member: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.sAdd(key, member)
  }

  public async smembers(key: string): Promise<string[]> {
    await this.ensureConnected()
    return await this.client!.sMembers(key)
  }

  public async srem(key: string, member: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.sRem(key, member)
  }

  public async zadd(key: string, score: number, member: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.zAdd(key, [{ score, value: member }])
  }

  public async zscore(key: string, member: string): Promise<number | null> {
    await this.ensureConnected()
    const result = await this.client!.zScore(key, member)
    return result !== null ? Number(result) : null
  }

  public async zrange(key: string, start: number, stop: number, options?: { REV?: boolean; WITHSCORES?: boolean }): Promise<string[]> {
    await this.ensureConnected()
    if (options?.REV) {
      return await this.client!.zRange(key, start, stop, { REV: true, WITHSCORES: options.WITHSCORES })
    }
    return await this.client!.zRange(key, start, stop, { WITHSCORES: options?.WITHSCORES })
  }

  public async zrem(key: string, member: string): Promise<number> {
    await this.ensureConnected()
    return await this.client!.zRem(key, member)
  }

  public async flushdb(): Promise<void> {
    await this.ensureConnected()
    await this.client!.flushDb()
  }

  public async flushall(): Promise<void> {
    await this.ensureConnected()
    await this.client!.flushAll()
  }

  public async ping(): Promise<string> {
    await this.ensureConnected()
    return await this.client!.ping()
  }

  public async info(): Promise<string> {
    await this.ensureConnected()
    return await this.client!.info()
  }

  public async select(database: number): Promise<void> {
    await this.ensureConnected()
    await this.client!.select(database)
  }

  public getClient(): RedisClientType {
    return this.client!
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected || !this.client) {
      if (!this.connectionPromise) {
        this.connectionPromise = this.connect()
      }
      await this.connectionPromise
    }
  }

  public getConfig(): RedisConfig {
    return { ...this.config }
  }

  public updateConfig(newConfig: Partial<RedisConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public async health(): Promise<{
    status: 'healthy' | 'unhealthy'
    connected: boolean
    latency?: number
    memory?: any
  }> {
    const start = Date.now()
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'unhealthy', connected: false }
      }

      await this.client.ping()
      const latency = Date.now() - start
      
      const memoryInfo = await this.client.info('memory')
      
      return {
        status: 'healthy',
        connected: true,
        latency,
        memory: this.parseRedisInfo(memoryInfo)
      }
    } catch (error) {
      return { status: 'unhealthy', connected: false }
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n')
    const result: Record<string, string> = {}
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        result[key] = value
      }
    }
    
    return result
  }
}

// Export both the class and a singleton instance
export { RedisClient }

// Create and export a default instance
const redisClient = RedisClient.getInstance()
export default redisClient

// Also export the raw redis client for backward compatibility
export const redis = redisClient.getClient()