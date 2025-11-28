import { injectable } from 'tsyringe'
import { ODataQuery } from './ODataParser'

interface CacheKey {
  entity: string
  query: string
  userId?: string
}

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

@injectable()
export class ODataCacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000

  private generateKey(entity: string, query: ODataQuery, userId?: string): string {
    const queryStr = JSON.stringify(query)
    return `${entity}:${userId || 'public'}:${this.hashString(queryStr)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  async get(entity: string, query: ODataQuery, userId?: string): Promise<any | null> {
    const key = this.generateKey(entity, query, userId)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    console.log(`OData Cache HIT for ${entity}`, query)
    return entry.data
  }

  async set(entity: string, query: ODataQuery, data: any, userId?: string, ttl?: number): Promise<void> {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.findOldestEntry()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    const key = this.generateKey(entity, query, userId)
    const now = Date.now()
    const expiresAt = now + (ttl || this.DEFAULT_TTL)

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    })

    console.log(`OData Cache SET for ${entity}`, query)
  }

  async invalidate(entity?: string): Promise<void> {
    if (entity) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key =>
        key.startsWith(`${entity}:`)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
    console.log(`OData Cache INVALIDATED for ${entity || 'all'}`)
  }

  async getStats(): Promise<{
    size: number
    maxSize: number
    hitRate: number
  }> {
    const now = Date.now()
    let validEntries = 0

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        validEntries++
      }
    }

    return {
      size: validEntries,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // TODO: implement hit/miss tracking
    }
  }

  private findOldestEntry(): string | null {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  isComplexQuery(query: ODataQuery): boolean {
    // A query is considered complex if it has:
    // - Multiple filters
    // - Deep filtering (nested fields with dot notation)
    // - Expands
    // - Large skip values
    return !!(
      (query.filter && query.filter.length > 3) ||
      query.expand?.length ||
      (query.skip && query.skip > 100) ||
      query.count
    )
  }

  getOptimalTTL(query: ODataQuery): number {
    let ttl = this.DEFAULT_TTL

    // Complex queries get longer cache time
    if (this.isComplexQuery(query)) {
      ttl *= 2
    }

    // Queries with $count get shorter cache time (more dynamic)
    if (query.count) {
      ttl = Math.floor(ttl / 2)
    }

    return ttl
  }
}

export default ODataCacheService
