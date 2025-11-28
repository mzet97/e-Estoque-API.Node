import RedisClient from '@shared/redis/RedisClient'
import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'

export interface SessionData {
  id: string
  userId: string
  companyId?: string
  data: Record<string, any>
  ip?: string
  userAgent?: string
  createdAt: Date
  lastAccessed: Date
  expiresAt: Date
  isActive: boolean
}

export interface SessionConfig {
  ttl: number
  maxSessionsPerUser: number
  cleanupInterval: number
  sessionPrefix: string
}

export interface SessionStats {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  averageSessionDuration: number
  sessionsPerUser: Record<string, number>
}

class SessionService extends EventEmitter {
  private redis: RedisClient
  private config: SessionConfig

  constructor(redis: RedisClient, config?: Partial<SessionConfig>) {
    super()
    this.redis = redis
    this.config = {
      ttl: 24 * 60 * 60, // 24 hours
      maxSessionsPerUser: 5,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      sessionPrefix: 'session:',
      ...config
    }

    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  // Session management
  async createSession(
    userId: string, 
    data: Record<string, any> = {}, 
    companyId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<SessionData> {
    try {
      const sessionId = uuidv4()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.config.ttl * 1000)

      const session: SessionData = {
        id: sessionId,
        userId,
        companyId,
        data,
        ip,
        userAgent,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
        isActive: true
      }

      // Check if user has reached max sessions
      await this.enforceSessionLimit(userId)

      // Store session
      const sessionKey = this.getSessionKey(sessionId)
      await this.redis.setex(sessionKey, this.config.ttl, JSON.stringify(session))

      // Store user session index
      const userSessionsKey = this.getUserSessionsKey(userId)
      await this.redis.sadd(userSessionsKey, sessionId)
      await this.redis.expire(userSessionsKey, this.config.ttl)

      // Store session index by company if provided
      if (companyId) {
        const companySessionsKey = this.getCompanySessionsKey(companyId)
        await this.redis.sadd(companySessionsKey, sessionId)
        await this.redis.expire(companySessionsKey, this.config.ttl)
      }

      this.emit('sessionCreated', session)
      console.log(`✅ Created session ${sessionId} for user ${userId}`)

      return session
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await this.redis.get(sessionKey)

      if (!sessionData) {
        return null
      }

      const session: SessionData = JSON.parse(sessionData)

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await this.deleteSession(sessionId)
        return null
      }

      // Update last accessed time
      session.lastAccessed = new Date()
      await this.redis.setex(sessionKey, this.getRemainingTTL(session), JSON.stringify(session))

      this.emit('sessionAccessed', session)
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  async updateSession(sessionId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      // Merge data
      session.data = { ...session.data, ...data }
      session.lastAccessed = new Date()

      const sessionKey = this.getSessionKey(sessionId)
      await this.redis.setex(sessionKey, this.getRemainingTTL(session), JSON.stringify(session))

      this.emit('sessionUpdated', session)
      return true
    } catch (error) {
      console.error('Error updating session:', error)
      return false
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      // Remove session key
      const sessionKey = this.getSessionKey(sessionId)
      await this.redis.del(sessionKey)

      // Remove from user sessions index
      const userSessionsKey = this.getUserSessionsKey(session.userId)
      await this.redis.srem(userSessionsKey, sessionId)

      // Remove from company sessions index
      if (session.companyId) {
        const companySessionsKey = this.getCompanySessionsKey(session.companyId)
        await this.redis.srem(companySessionsKey, sessionId)
      }

      session.isActive = false
      this.emit('sessionDeleted', session)

      console.log(`🗑️ Deleted session ${sessionId} for user ${session.userId}`)
      return true
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  async deleteUserSessions(userId: string): Promise<number> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await this.redis.smembers(userSessionsKey)

      let deletedCount = 0
      for (const sessionId of sessionIds) {
        const deleted = await this.deleteSession(sessionId)
        if (deleted) {
          deletedCount++
        }
      }

      // Clean up the sessions index
      await this.redis.del(userSessionsKey)

      console.log(`🗑️ Deleted ${deletedCount} sessions for user ${userId}`)
      return deletedCount
    } catch (error) {
      console.error('Error deleting user sessions:', error)
      return 0
    }
  }

  // Session queries
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await this.redis.smembers(userSessionsKey)

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    } catch (error) {
      console.error('Error getting user sessions:', error)
      return []
    }
  }

  async getCompanySessions(companyId: string): Promise<SessionData[]> {
    try {
      const companySessionsKey = this.getCompanySessionsKey(companyId)
      const sessionIds = await this.redis.smembers(companySessionsKey)

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    } catch (error) {
      console.error('Error getting company sessions:', error)
      return []
    }
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId)
    return session !== null && session.isActive
  }

  async getSessionCount(userId?: string, companyId?: string): Promise<number> {
    try {
      if (userId) {
        const userSessionsKey = this.getUserSessionsKey(userId)
        return await this.redis.scard(userSessionsKey)
      } else if (companyId) {
        const companySessionsKey = this.getCompanySessionsKey(companyId)
        return await this.redis.scard(companySessionsKey)
      }
      return 0
    } catch (error) {
      console.error('Error getting session count:', error)
      return 0
    }
  }

  // Statistics and monitoring
  async getStatistics(): Promise<SessionStats> {
    try {
      const totalSessions = await this.redis.dbSize()
      let activeSessions = 0
      let expiredSessions = 0
      const sessionsPerUser: Record<string, number> = {}

      // Get all session keys
      const sessionKeys = await this.redis.keys(`${this.config.sessionPrefix}*`)
      const now = new Date()

      for (const key of sessionKeys) {
        try {
          const sessionData = await this.redis.get(key)
          if (sessionData) {
            const session: SessionData = JSON.parse(sessionData)
            if (now <= session.expiresAt) {
              activeSessions++
            } else {
              expiredSessions++
            }

            // Count sessions per user
            if (sessionsPerUser[session.userId]) {
              sessionsPerUser[session.userId]++
            } else {
              sessionsPerUser[session.userId] = 1
            }
          }
        } catch (error) {
          console.warn(`Error processing session key ${key}:`, error)
        }
      }

      // Calculate average session duration
      let totalDuration = 0
      let sessionCount = 0
      for (const sessionId of sessionKeys) {
        const sessionData = await this.redis.get(sessionId)
        if (sessionData) {
          try {
            const session: SessionData = JSON.parse(sessionData)
            totalDuration += session.lastAccessed.getTime() - session.createdAt.getTime()
            sessionCount++
          } catch (error) {
            // Skip invalid sessions
          }
        }
      }

      const averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0

      return {
        totalSessions,
        activeSessions,
        expiredSessions,
        averageSessionDuration,
        sessionsPerUser
      }
    } catch (error) {
      console.error('Error getting session statistics:', error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        averageSessionDuration: 0,
        sessionsPerUser: {}
      }
    }
  }

  // Maintenance operations
  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const currentCount = await this.redis.scard(userSessionsKey)

      if (currentCount >= this.config.maxSessionsPerUser) {
        // Remove oldest session
        const sessions = await this.getUserSessions(userId)
        if (sessions.length > 0) {
          const oldestSession = sessions[sessions.length - 1]
          await this.deleteSession(oldestSession.id)
          console.log(`🧹 Removed oldest session for user ${userId} to enforce limit`)
        }
      }
    } catch (error) {
      console.error('Error enforcing session limit:', error)
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionKeys = await this.redis.keys(`${this.config.sessionPrefix}*`)
      const now = new Date()
      let cleanedCount = 0

      for (const key of sessionKeys) {
        try {
          const sessionData = await this.redis.get(key)
          if (sessionData) {
            const session: SessionData = JSON.parse(sessionData)
            if (now > session.expiresAt) {
              await this.redis.del(key)
              cleanedCount++

              // Clean up indices
              const userSessionsKey = this.getUserSessionsKey(session.userId)
              await this.redis.srem(userSessionsKey, session.id)

              if (session.companyId) {
                const companySessionsKey = this.getCompanySessionsKey(session.companyId)
                await this.redis.srem(companySessionsKey, session.id)
              }
            }
          }
        } catch (error) {
          console.warn(`Error cleaning up session ${key}:`, error)
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`)
      this.emit('cleanupCompleted', { cleanedCount })
      return cleanedCount
    } catch (error) {
      console.error('Error during session cleanup:', error)
      return 0
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions()
      } catch (error) {
        console.error('Error in periodic cleanup:', error)
      }
    }, this.config.cleanupInterval)
  }

  // Utility methods
  private getSessionKey(sessionId: string): string {
    return `${this.config.sessionPrefix}${sessionId}`
  }

  private getUserSessionsKey(userId: string): string {
    return `${this.config.sessionPrefix}user:${userId}:sessions`
  }

  private getCompanySessionsKey(companyId: string): string {
    return `${this.config.sessionPrefix}company:${companyId}:sessions`
  }

  private getRemainingTTL(session: SessionData): number {
    const remaining = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      return false
    }
  }
}

export default SessionService