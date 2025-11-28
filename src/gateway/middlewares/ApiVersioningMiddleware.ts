import { Request, Response, NextFunction } from 'express'
import { RedisClient } from '@shared/redis/RedisClient'

// Supported API versions
const SUPPORTED_VERSIONS = ['v1', 'v2', 'v3']
const DEFAULT_VERSION = 'v1'
const DEPRECATION_NOTICE_VERSION = 'v1'

// Version compatibility matrix
const VERSION_COMPATIBILITY = {
  'v1': {
    supported: true,
    deprecated: true,
    sunsetDate: '2025-12-31',
    replacement: 'v2',
    breakingChanges: [
      'Removed legacy authentication headers',
      'Changed response format for error messages',
      'Updated date format from DD/MM/YYYY to ISO 8601'
    ]
  },
  'v2': {
    supported: true,
    deprecated: false,
    sunsetDate: null,
    replacement: null,
    breakingChanges: [
      'Enhanced security headers required',
      'Modified pagination response structure',
      'Updated rate limiting headers'
    ]
  },
  'v3': {
    supported: true,
    deprecated: false,
    sunsetDate: null,
    replacement: null,
    breakingChanges: []
  }
}

// Service endpoint versions mapping
const SERVICE_VERSION_MAP = {
  'auth': {
    'v1': process.env.AUTH_V1_URL || 'http://localhost:3001/v1',
    'v2': process.env.AUTH_V2_URL || 'http://localhost:3001/v2',
    'v3': process.env.AUTH_V3_URL || 'http://localhost:3001/v3'
  },
  'companies': {
    'v1': process.env.COMPANIES_V1_URL || 'http://localhost:3002/v1',
    'v2': process.env.COMPANIES_V2_URL || 'http://localhost:3002/v2',
    'v3': process.env.COMPANIES_V3_URL || 'http://localhost:3002/v3'
  },
  'customers': {
    'v1': process.env.CUSTOMERS_V1_URL || 'http://localhost:3003/v1',
    'v2': process.env.CUSTOMERS_V2_URL || 'http://localhost:3003/v2',
    'v3': process.env.CUSTOMERS_V3_URL || 'http://localhost:3003/v3'
  },
  'sales': {
    'v1': process.env.SALES_V1_URL || 'http://localhost:3004/v1',
    'v2': process.env.SALES_V2_URL || 'http://localhost:3004/v2',
    'v3': process.env.SALES_V3_URL || 'http://localhost:3004/v3'
  },
  'inventory': {
    'v1': process.env.INVENTORY_V1_URL || 'http://localhost:3005/v1',
    'v2': process.env.INVENTORY_V2_URL || 'http://localhost:3005/v2',
    'v3': process.env.INVENTORY_V3_URL || 'http://localhost:3005/v3'
  }
}

class ApiVersioningMiddleware {
  private redis: RedisClient

  constructor() {
    this.redis = RedisClient.getInstance()
    this.initializeVersionStats()
  }

  private async initializeVersionStats() {
    try {
      // Initialize version usage statistics in Redis
      for (const version of SUPPORTED_VERSIONS) {
        const key = `api:stats:version:${version}`
        await this.redis.setnx(key, '0')
      }
    } catch (error) {
      console.error('Failed to initialize version statistics:', error)
    }
  }

  /**
   * Main API versioning middleware
   */
  createVersioningMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract API version from request
        const apiVersion = this.extractApiVersion(req)
        
        // Validate version
        if (!this.isValidVersion(apiVersion)) {
          return this.sendInvalidVersionResponse(res, apiVersion)
        }

        // Attach version info to request
        ;(req as any).apiVersion = apiVersion
        ;(req as any).versionInfo = VERSION_COMPATIBILITY[apiVersion as keyof typeof VERSION_COMPATIBILITY]

        // Update version statistics
        await this.updateVersionStats(apiVersion)

        // Add version headers to response
        this.addVersionHeaders(res, apiVersion)

        // Check for deprecation warnings
        if (this.isDeprecated(apiVersion)) {
          this.addDeprecationHeaders(res, apiVersion)
        }

        // Handle version-specific routing
        this.handleVersionRouting(req, apiVersion)

        next()
      } catch (error) {
        console.error('Error in API versioning middleware:', error)
        res.status(500).json({
          success: false,
          error: 'VERSIONING_ERROR',
          message: 'API versioning configuration error',
          code: 'VERSIONING_ERROR'
        })
      }
    }
  }

  private extractApiVersion(req: Request): string {
    // Check Accept header for version
    const acceptHeader = req.get('Accept')
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.eestoque\.v(\d+)\+json/)
      if (versionMatch) {
        return `v${versionMatch[1]}`
      }
    }

    // Check URL path for version
    const pathVersion = req.path.match(/^\/v(\d+)/)
    if (pathVersion) {
      return `v${pathVersion[1]}`
    }

    // Check X-API-Version header
    const apiVersionHeader = req.get('X-API-Version')
    if (apiVersionHeader) {
      return apiVersionHeader.startsWith('v') ? apiVersionHeader : `v${apiVersionHeader}`
    }

    // Check query parameter
    const queryVersion = req.query.version as string
    if (queryVersion) {
      return queryVersion.startsWith('v') ? queryVersion : `v${queryVersion}`
    }

    // Return default version
    return DEFAULT_VERSION
  }

  private isValidVersion(version: string): boolean {
    return SUPPORTED_VERSIONS.includes(version)
  }

  private isDeprecated(version: string): boolean {
    return VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]?.deprecated === true
  }

  private sendInvalidVersionResponse(res: Response, version: string) {
    res.status(400).json({
      success: false,
      error: 'INVALID_API_VERSION',
      message: `API version '${version}' is not supported`,
      code: 'INVALID_API_VERSION',
      supportedVersions: SUPPORTED_VERSIONS,
      defaultVersion: DEFAULT_VERSION,
      examples: {
        acceptHeader: 'Accept: application/vnd.eestoque.v2+json',
        urlPath: '/v2/customers',
        header: 'X-API-Version: v2',
        queryParam: '/customers?version=v2'
      }
    })
  }

  private addVersionHeaders(res: Response, version: string) {
    const versionInfo = VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
    
    res.set({
      'X-API-Version': version,
      'X-API-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
      'X-API-Default-Version': DEFAULT_VERSION
    })

    // Add per-service version info
    if (versionInfo) {
      res.set({
        'X-API-Version-Deprecated': versionInfo.deprecated.toString(),
        'X-API-Version-Supported': versionInfo.supported.toString()
      })
    }
  }

  private addDeprecationHeaders(res: Response, version: string) {
    const versionInfo = VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
    
    if (versionInfo?.deprecated) {
      res.set({
        'Deprecation': 'true',
        'Sunset': versionInfo.sunsetDate,
        'Link': `<https://docs.eestoque.com/v3>; rel="latest-version"`,
        'Warning': `299 - "This API version is deprecated and will be removed on ${versionInfo.sunsetDate}"`
      })
    }
  }

  private handleVersionRouting(req: Request, apiVersion: string) {
    // Remove version from path for downstream services
    const originalPath = req.path
    const versionPath = `/v${apiVersion.replace('v', '')}`
    
    // Store original path for logging
    ;(req as any).originalPath = originalPath
    
    // Remove version prefix for internal routing
    if (originalPath.startsWith(versionPath)) {
      req.path = originalPath.substring(versionPath.length) || '/'
    }
  }

  private async updateVersionStats(version: string) {
    try {
      const key = `api:stats:version:${version}`
      await this.redis.incr(key)
      
      // Also track by date
      const dateKey = `api:stats:version:${version}:${new Date().toISOString().slice(0, 10)}`
      await this.redis.incr(dateKey)
      
      // Set expiry for date keys
      await this.redis.expire(dateKey, 365 * 24 * 3600) // 1 year
    } catch (error) {
      console.error('Failed to update version statistics:', error)
    }
  }

  /**
   * Get version-specific service URL
   */
  getServiceUrl(serviceName: string, version: string): string {
    const serviceVersions = SERVICE_VERSION_MAP[serviceName as keyof typeof SERVICE_VERSION_MAP]
    if (!serviceVersions) {
      throw new Error(`Service ${serviceName} not found in version mapping`)
    }

    const url = serviceVersions[version as keyof typeof serviceVersions]
    if (!url) {
      throw new Error(`Version ${version} not supported for service ${serviceName}`)
    }

    return url
  }

  /**
   * Get available versions for a service
   */
  getAvailableVersions(serviceName: string): string[] {
    const serviceVersions = SERVICE_VERSION_MAP[serviceName as keyof typeof SERVICE_VERSION_MAP]
    return serviceVersions ? Object.keys(serviceVersions) : []
  }

  /**
   * Check if version supports specific feature
   */
  supportsFeature(version: string, feature: string): boolean {
    const versionInfo = VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
    
    if (!versionInfo || !versionInfo.supported) {
      return false
    }

    // Define feature support matrix
    const featureSupport = {
      'v1': [
        'basic_auth',
        'json_responses',
        'pagination',
        'rate_limiting'
      ],
      'v2': [
        'basic_auth',
        'json_responses',
        'pagination',
        'rate_limiting',
        'jwt_auth',
        'webhooks',
        'bulk_operations',
        'enhanced_filters'
      ],
      'v3': [
        'basic_auth',
        'jwt_auth',
        'json_responses',
        'pagination',
        'rate_limiting',
        'webhooks',
        'bulk_operations',
        'enhanced_filters',
        'graph_ql',
        'real_time_events',
        'advanced_analytics'
      ]
    }

    return featureSupport[version as keyof typeof featureSupport]?.includes(feature) || false
  }

  /**
   * Get breaking changes for a version
   */
  getBreakingChanges(version: string): string[] {
    const versionInfo = VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
    return versionInfo?.breakingChanges || []
  }

  /**
   * Get version deprecation info
   */
  getDeprecationInfo(version: string) {
    return VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
  }

  /**
   * Get version statistics
   */
  async getVersionStatistics(timeframe: string = '24h') {
    try {
      const stats: Record<string, any> = {}
      
      for (const version of SUPPORTED_VERSIONS) {
        const key = `api:stats:version:${version}`
        const count = await this.redis.get(key)
        
        stats[version] = {
          totalRequests: parseInt(count || '0'),
          deprecated: this.isDeprecated(version),
          versionInfo: VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY]
        }
      }

      return {
        timeframe,
        statistics: stats,
        totalRequests: Object.values(stats).reduce((sum, stat) => sum + stat.totalRequests, 0),
        mostUsedVersion: Object.entries(stats).reduce((max, [version, stat]) => 
          stat.totalRequests > max.count ? { version, count: stat.totalRequests } : max,
          { version: 'none', count: 0 }
        )
      }
    } catch (error) {
      console.error('Failed to get version statistics:', error)
      return null
    }
  }

  /**
   * Check version compatibility between client and server
   */
  checkVersionCompatibility(clientVersion: string, serverVersion: string): {
    compatible: boolean
    warnings: string[]
    recommendations: string[]
  } {
    const warnings: string[] = []
    const recommendations: string[] = []

    if (!this.isValidVersion(clientVersion)) {
      warnings.push(`Client version '${clientVersion}' is not supported`)
      recommendations.push(`Please upgrade to one of: ${SUPPORTED_VERSIONS.join(', ')}`)
    }

    if (this.isDeprecated(clientVersion)) {
      const versionInfo = VERSION_COMPATIBILITY[clientVersion as keyof typeof VERSION_COMPATIBILITY]
      warnings.push(`API version '${clientVersion}' is deprecated`)
      
      if (versionInfo?.replacement) {
        recommendations.push(`Please migrate to version '${versionInfo.replacement}'`)
      }
      
      if (versionInfo?.sunsetDate) {
        warnings.push(`This version will be discontinued on ${versionInfo.sunsetDate}`)
      }
    }

    // Check feature compatibility
    const clientFeatures = ['basic_auth', 'json_responses', 'pagination']
    const serverFeatures = ['basic_auth', 'json_responses', 'pagination', 'jwt_auth']
    
    const missingFeatures = clientFeatures.filter(feature => !serverFeatures.includes(feature))
    if (missingFeatures.length > 0) {
      warnings.push(`Server does not support features: ${missingFeatures.join(', ')}`)
    }

    return {
      compatible: warnings.length === 0,
      warnings,
      recommendations
    }
  }

  /**
   * Create version-specific middleware
   */
  createVersionSpecificMiddleware(version: string, middleware: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientVersion = (req as any).apiVersion || DEFAULT_VERSION
      
      if (clientVersion === version) {
        return middleware(req, res, next)
      }
      
      next()
    }
  }

  /**
   * Validate request against version requirements
   */
  validateVersionRequirements(version: string, requirements: {
    minVersion?: string
    features?: string[]
    deprecated?: boolean
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientVersion = (req as any).apiVersion || DEFAULT_VERSION

      // Check minimum version
      if (requirements.minVersion) {
        const clientVersionNum = parseInt(clientVersion.replace('v', ''))
        const minVersionNum = parseInt(requirements.minVersion.replace('v', ''))
        
        if (clientVersionNum < minVersionNum) {
          return res.status(400).json({
            success: false,
            error: 'INSUFFICIENT_API_VERSION',
            message: `This endpoint requires minimum API version ${requirements.minVersion}, but client is using ${clientVersion}`,
            code: 'INSUFFICIENT_API_VERSION',
            clientVersion,
            requiredVersion: requirements.minVersion
          })
        }
      }

      // Check feature requirements
      if (requirements.features) {
        const missingFeatures = requirements.features.filter(feature => 
          !this.supportsFeature(clientVersion, feature)
        )

        if (missingFeatures.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_API_FEATURES',
            message: `API version ${clientVersion} does not support required features: ${missingFeatures.join(', ')}`,
            code: 'MISSING_API_FEATURES',
            clientVersion,
            missingFeatures
          })
        }
      }

      // Check deprecation requirement
      if (requirements.deprecated === false && this.isDeprecated(clientVersion)) {
        return res.status(400).json({
          success: false,
          error: 'DEPRECATED_VERSION_NOT_ALLOWED',
          message: `This endpoint does not allow deprecated API versions`,
          code: 'DEPRECATED_VERSION_NOT_ALLOWED',
          clientVersion,
          recommendedVersion: VERSION_COMPATIBILITY[clientVersion as keyof typeof VERSION_COMPATIBILITY]?.replacement
        })
      }

      next()
    }
  }
}

export default new ApiVersioningMiddleware()

// Export middleware functions
export const {
  createVersioningMiddleware,
  getServiceUrl,
  getAvailableVersions,
  supportsFeature,
  getBreakingChanges,
  getDeprecationInfo,
  getVersionStatistics,
  checkVersionCompatibility,
  createVersionSpecificMiddleware,
  validateVersionRequirements
} = new ApiVersioningMiddleware()

// Export constants for use in other modules
export {
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
  DEPRECATION_NOTICE_VERSION,
  VERSION_COMPATIBILITY,
  SERVICE_VERSION_MAP
}