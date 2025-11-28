/**
 * Staging Environment Configuration
 * E-Estoque API - Staging Settings
 */

export const stagingConfig = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'staging',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: {
      rejectUnauthorized: false
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 180000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    logging: true // Enable SQL logging for debugging
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || '',
    retryDelay: 100,
    maxRetriesPerRequest: 3,
    maxRetriesPerConnection: 3,
    connectTimeout: 3000,
    commandTimeout: 3000,
    lazyConnect: false
  },

  // RabbitMQ Configuration
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || '',
    options: {
      heartbeat: 30,
      reconnectTimeInSeconds: 30,
      prefetch: 5,
      durable: true,
      autoDelete: false
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '',
    issuer: process.env.JWT_ISSUER || 'eestoque-staging',
    audience: process.env.JWT_AUDIENCE || 'eestoque-staging-client',
    expiresIn: '2h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256'
  },

  // Rate Limiting
  rateLimit: {
    defaultLimit: 2000,
    tierLimits: {
      free: 200,
      basic: 2000,
      premium: 20000,
      admin: -1
    },
    windowMs: 60000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeout: 30000,
    monitorInterval: 10000,
    timeout: 3000,
    errorThresholdPercentage: 50,
    volumeThreshold: 5
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    serviceName: 'eestoque-staging-api',
    environment: 'staging',
    enableConsole: true,
    enableFile: true,
    logDirectory: '/app/logs',
    maxFileSize: '10MB',
    maxFiles: 5,
    format: 'json',
    includeStack: true,
    includeHeaders: true,
    includeBodies: true,
    sensitiveFields: ['password', 'token', 'secret', 'key'],
    logRequests: true,
    logErrors: true,
    logPerformance: true
  },

  // Metrics Configuration
  metrics: {
    serviceName: 'eestoque-staging-api',
    environment: 'staging',
    port: parseInt(process.env.METRICS_PORT || '9091', 10),
    collectDefaultMetrics: true,
    collectDefaultProcessMetrics: true,
    collectGcMetrics: true,
    collectHeapStatsMetrics: true,
    collectEventLoopMetrics: true,
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    defaultLabels: {
      service: 'eestoque-staging-api',
      environment: 'staging',
      version: process.env.npm_package_version || '1.0.0'
    }
  },

  // Health Check Configuration
  health: {
    port: parseInt(process.env.HEALTH_PORT || '3000', 10),
    endpoints: {
      health: '/health',
      detailed: '/health/detailed',
      live: '/health/live',
      ready: '/health/ready',
      started: '/health/started'
    },
    checks: {
      database: {
        enabled: true,
        timeout: 10000
      },
      redis: {
        enabled: true,
        timeout: 5000
      },
      rabbitmq: {
        enabled: true,
        timeout: 10000
      },
      disk: {
        enabled: true,
        threshold: 85,
        path: '/'
      },
      memory: {
        enabled: true,
        threshold: 85
      }
    }
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'https://staging.eestoque.com',
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID'
      ]
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"]
        }
      }
    }
  },

  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'mock',
    templates: {
      welcome: 'welcome-template-staging',
      passwordReset: 'password-reset-template-staging',
      orderConfirmation: 'order-confirmation-template-staging',
      lowStock: 'low-stock-template-staging'
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'E-Estoque Staging',
      address: process.env.EMAIL_FROM_ADDRESS || 'staging@eestoque.com'
    },
    mock: {
      enabled: true,
      logToConsole: true
    }
  },

  // File Storage Configuration
  fileStorage: {
    provider: process.env.FILE_STORAGE_PROVIDER || 'local',
    local: {
      uploadDir: '/app/uploads',
      publicDir: '/app/public'
    },
    limits: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    }
  },

  // API Configuration
  api: {
    version: 'v1',
    defaultVersion: 'v1',
    supportedVersions: ['v1', 'v2'],
    timeout: 60000, // 60 seconds
    compression: {
      threshold: 512,
      level: 4
    },
    pagination: {
      defaultLimit: 20,
      maxLimit: 200,
      maxPages: 1000
    }
  },

  // Load Balancing
  loadBalancing: {
    strategies: ['round-robin', 'least-connections'],
    defaultStrategy: 'round-robin',
    healthCheckInterval: 15000, // 15 seconds
    healthCheckTimeout: 3000,   // 3 seconds
    healthCheckRetries: 3,
    circuitBreakerEnabled: true,
    timeout: 10000 // 10 seconds
  },

  // Monitoring & Observability
  monitoring: {
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    samplingRate: 1.0, // 100% sampling for staging
    tracesEndpoint: process.env.TRACES_ENDPOINT || '',
    metricsEndpoint: process.env.METRICS_ENDPOINT || '',
    alerting: {
      enabled: true,
      channels: ['slack'],
      thresholds: {
        errorRate: 0.10,      // 10%
        responseTime: 5000,   // 5 seconds
        memoryUsage: 0.85,    // 85%
        cpuUsage: 0.85        // 85%
      }
    }
  },

  // Cache Configuration
  cache: {
    defaultTTL: 600,      // 10 minutes
    maxTTL: 7200,         // 2 hours
    namespaces: {
      users: 1200,        // 20 minutes
      products: 600,      // 10 minutes
      orders: 300,        // 5 minutes
      inventory: 180,     // 3 minutes
      sessions: 3600      // 1 hour
    },
    strategies: {
      read: 'cache-first',
      write: 'write-through',
      invalidate: 'write-back'
    }
  },

  // Feature Flags
  features: {
    enableNewAPI: true,
    enableBetaFeatures: true,
    enableMaintenanceMode: false,
    enableRateLimiting: true,
    enableCircuitBreaker: true,
    enableMetrics: true,
    enableTracing: true,
    enableDebugLogs: true
  },

  // Backup Configuration
  backup: {
    database: {
      enabled: false, // Disabled for staging
      schedule: '0 4 * * *', // Daily at 4 AM
      retention: 7,          // 7 days
      destination: process.env.BACKUP_DESTINATION || ''
    },
    files: {
      enabled: false, // Disabled for staging
      schedule: '0 5 * * *', // Daily at 5 AM
      retention: 3,          // 3 days
      destination: process.env.FILE_BACKUP_DESTINATION || ''
    }
  }
};

// Validation function
export function validateStagingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required environment variables (less strict for staging)
  const required = [
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  required.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export configuration validation on module load
const validation = validateStagingConfig();
if (!validation.valid) {
  console.warn('⚠️ Staging configuration validation warnings:', validation.errors);
}

export default stagingConfig;