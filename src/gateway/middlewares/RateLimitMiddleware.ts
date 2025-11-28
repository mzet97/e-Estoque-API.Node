import { Request, Response, NextFunction } from 'express'
import RedisClient from '@shared/redis/RedisClient'

// Simple in-memory rate limiter for demonstration
// In production, you would use Redis for distributed rate limiting
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private config: { limit: number; windowMs: number }

  constructor(limit: number, windowMs: number) {
    this.config = { limit, windowMs }
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const record = this.requests.get(key)
    
    if (!record || now > record.resetTime) {
      // Reset or new record
      const resetTime = now + this.config.windowMs
      this.requests.set(key, { count: 1, resetTime })
      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetTime
      }
    }
    
    if (record.count >= this.config.limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      }
    }
    
    // Increment counter
    record.count++
    this.requests.set(key, record)
    
    return {
      allowed: true,
      remaining: this.config.limit - record.count,
      resetTime: record.resetTime
    }
  }
}

class RateLimitMiddleware {
  private redisClient: RedisClient
  private limiters: Map<string, SimpleRateLimiter> = new Map()
  
  constructor() {
    this.redisClient = RedisClient.getInstance()
    this.initializeLimiters()
  }

  private initializeLimiters() {
    // Initialize limiters for different tiers
    this.limiters.set('free', new SimpleRateLimiter(100, 3600000)) // 100/hour
    this.limiters.set('basic', new SimpleRateLimiter(1000, 3600000)) // 1000/hour
    this.limiters.set('premium', new SimpleRateLimiter(10000, 3600000)) // 10000/hour
    this.limiters.set('admin', new SimpleRateLimiter(50000, 3600000)) // 50000/hour
    this.limiters.set('strict', new SimpleRateLimiter(10, 60000)) // 10/minute
  }

  private getUserTier(req: Request): string {
    // Extract user tier from JWT or other source
    // For now, default to basic
    const user = (req as any).user
    return user?.tier || 'basic'
  }

  private getClientKey(req: Request): string {
    // Get client identifier (IP + User-Agent for fingerprinting)
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.get('User-Agent') || 'unknown'
    return `client:${ip}:${userAgent}`
  }

  async checkRateLimit(req: Request): Promise<{ allowed: boolean; remaining: number; resetTime: number; tier: string }> {
    const tier = this.getUserTier(req)
    const clientKey = this.getClientKey(req)
    const limiter = this.limiters.get(tier) || this.limiters.get('basic')!

    const result = await limiter.checkLimit(`${tier}:${clientKey}`)
    return { ...result, tier }
  }

  /**
   * Middleware for tier-based rate limiting
   */
  public static createTierBasedLimiter() {
    const rateLimitMiddleware = new RateLimitMiddleware()
    
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { allowed, remaining, resetTime, tier } = await rateLimitMiddleware.checkRateLimit(req)
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', '100')
        res.setHeader('X-RateLimit-Remaining', remaining.toString())
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString())
        res.setHeader('X-RateLimit-Tier', tier)

        if (!allowed) {
          return res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded for your user tier',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
          })
        }

        next()
      } catch (error) {
        console.error('Rate limiting error:', error)
        next() // Continue on error to avoid blocking requests
      }
    }
  }

  /**
   * Middleware for strict rate limiting (for sensitive endpoints)
   */
  public static createStrictLimiter(limit: number, windowMs: number, blockDuration?: number) {
    const strictLimiter = new SimpleRateLimiter(limit, windowMs)
    
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const clientKey = req.ip || req.connection.remoteAddress || 'unknown'
        const result = await strictLimiter.checkLimit(`strict:${clientKey}`)
        
        // Add strict rate limit headers
        res.setHeader('X-Strict-RateLimit-Limit', limit.toString())
        res.setHeader('X-Strict-RateLimit-Remaining', result.remaining.toString())
        res.setHeader('X-Strict-RateLimit-Reset', new Date(result.resetTime).toISOString())

        if (!result.allowed) {
          return res.status(429).json({
            success: false,
            error: 'STRICT_RATE_LIMIT_EXCEEDED',
            message: 'Strict rate limit exceeded. Access temporarily restricted.',
            code: 'STRICT_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          })
        }

        next()
      } catch (error) {
        console.error('Strict rate limiting error:', error)
        next() // Continue on error to avoid blocking requests
      }
    }
  }

  /**
   * Get rate limiting statistics
   */
  public async getRateLimitStats(): Promise<any> {
    try {
      // This would typically fetch from Redis
      // For now, return mock data
      return {
        totalRequests: 0,
        blockedRequests: 0,
        currentUsage: 0,
        topClients: []
      }
    } catch (error) {
      console.error('Failed to get rate limit stats:', error)
      return null
    }
  }

  /**
   * Reset rate limit for a specific client (admin function)
   */
  public async resetClientLimit(clientKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would clear Redis keys
      console.log(`Resetting rate limit for client: ${clientKey}`)
      return true
    } catch (error) {
      console.error('Failed to reset client rate limit:', error)
      return false
    }
  }
}

export { RateLimitMiddleware }
export default RateLimitMiddleware