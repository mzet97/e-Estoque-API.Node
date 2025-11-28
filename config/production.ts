/**
 * Production Environment Configuration
 * E-Estoque API - Production Settings
 */

export const productionConfig = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: {
      rejectUnauthorized: true
    },
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 300000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    logging: false // Disable SQL logging in production
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || '',
    retryDelay: 100,
    maxRetriesPerRequest: 3,
    maxRetriesPerConnection: 3,
    connectTimeout: 5000,
    commandTimeout: 3000,
    lazyConnect: false,
    tls: {
      rejectUnauthorized: true
    }
  },

  // RabbitMQ Configuration
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || '',
    options: {
      heartbeat: 30,
      reconnectTimeInSeconds: 30,
      prefetch: 10,
      durable: true,
      autoDelete: false,
      arguments: {
        'x-dead-letter-exchange': 'dead-letter-exchange',
        'x-message-ttl': 86400000 // 24 hours
      }
    },
    exchanges: {
      events: {
        name: 'eestoque.events',
        type: 'topic',
        options: { durable: true }
      },
      commands: {
        name: 'eestoque.commands',
        type: 'direct',
        options: { durable: true }
      },
      deadLetter: {
        name: 'dead-letter-exchange',
        type: 'topic',
        options: { durable: true }
      }
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '',
    issuer: process.env.JWT_ISSUER || 'eestoque-api',
    audience: process.env.JWT_AUDIENCE || 'eestoque-client',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256',
    keyRotationInterval: 86400000 // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    defaultLimit: 1000,
    tierLimits: {
      free: 100,
      basic: 1000,
      premium: 10000,
      admin: -1 // unlimited
    },
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: any) => {
      return req.user?.id || req.ip;
    }
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitorInterval: 10000, // 10 seconds
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50,
    volumeThreshold: 10,
    resetInterval: 60000
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    serviceName: 'eestoque-api',
    environment: 'production',
    enableConsole: false,
    enableFile: true,
    logDirectory: '/app/logs',
    maxFileSize: '10MB',
    maxFiles: 10,
    datePattern: 'YYYY-MM-DD',
    format: 'json',
    includeStack: false,
    includeHeaders: false,
    includeBodies: false,
    sensitiveFields: ['password', 'token', 'secret', 'key', 'creditCard'],
    logRequests: true,
    logErrors: true,
    logPerformance: true
  },

  // Metrics Configuration
  metrics: {
    serviceName: 'eestoque-api',
    environment: 'production',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
    collectDefaultMetrics: true,
    collectDefaultProcessMetrics: true,
    collectGcMetrics: true,
    collectHeapStatsMetrics: true,
    collectEventLoopMetrics: true,
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    defaultLabels: {
      service: 'eestoque-api',
      environment: 'production',
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
        timeout: 5000
      },
      redis: {
        enabled: true,
        timeout: 3000
      },
      rabbitmq: {
        enabled: true,
        timeout: 5000
      },
      disk: {
        enabled: true,
        threshold: 90,
        path: '/'
      },
      memory: {
        enabled: true,
        threshold: 90
      }
    }
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['https://eestoque.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Correlation-ID']
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 12,
      tagLength: 16
    }
  },

  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    templates: {
      welcome: 'welcome-template-id',
      passwordReset: 'password-reset-template-id',
      orderConfirmation: 'order-confirmation-template-id',
      lowStock: 'low-stock-template-id'
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'E-Estoque',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@eestoque.com'
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || ''
    },
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  },

  // File Storage Configuration
  fileStorage: {
    provider: process.env.FILE_STORAGE_PROVIDER || 's3',
    bucket: process.env.FILE_STORAGE_BUCKET || 'eestoque-files',
    region: process.env.FILE_STORAGE_REGION || 'us-east-1',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    limits: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
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
    timeout: 30000, // 30 seconds
    compression: {
      threshold: 1024,
      level: 6
    },
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
      maxPages: 1000
    }
  },

  // Load Balancing
  loadBalancing: {
    strategies: ['round-robin', 'least-connections', 'weighted-round-robin'],
    defaultStrategy: 'round-robin',
    healthCheckInterval: 30000, // 30 seconds
    healthCheckTimeout: 5000,   // 5 seconds
    healthCheckRetries: 3,
    circuitBreakerEnabled: true,
    timeout: 5000 // 5 seconds
  },

  // Monitoring & Observability
  monitoring: {
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    samplingRate: 0.1, // 10% sampling
    tracesEndpoint: process.env.TRACES_ENDPOINT || '',
    metricsEndpoint: process.env.METRICS_ENDPOINT || '',
    alerting: {
      enabled: true,
      channels: ['slack', 'email', 'webhook'],
      thresholds: {
        errorRate: 0.05,      // 5%
        responseTime: 2000,   // 2 seconds
        memoryUsage: 0.8,     // 80%
        cpuUsage: 0.8         // 80%
      }
    }
  },

  // Cache Configuration
  cache: {
    defaultTTL: 300,      // 5 minutes
    maxTTL: 3600,         // 1 hour
    namespaces: {
      users: 600,         // 10 minutes
      products: 300,      // 5 minutes
      orders: 180,        // 3 minutes
      inventory: 120,     // 2 minutes
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
    enableBetaFeatures: false,
    enableMaintenanceMode: false,
    enableRateLimiting: true,
    enableCircuitBreaker: true,
    enableMetrics: true,
    enableTracing: true,
    enableDebugLogs: false
  },

  // Backup Configuration
  backup: {
    database: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30,         // 30 days
      destination: process.env.BACKUP_DESTINATION || 's3://eestoque-backups'
    },
    files: {
      enabled: true,
      schedule: '0 3 * * *', // Daily at 3 AM
      retention: 7,          // 7 days
      destination: process.env.FILE_BACKUP_DESTINATION || 's3://eestoque-file-backups'
    }
  }
};

// Validation function
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required environment variables
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'RABBITMQ_URL',
    'JWT_SECRET'
  ];
  
  required.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Validation checks
  if (productionConfig.rateLimit.defaultLimit < 0) {
    errors.push('Rate limit default limit must be non-negative');
  }
  
  if (productionConfig.circuitBreaker.failureThreshold < 1) {
    errors.push('Circuit breaker failure threshold must be at least 1');
  }
  
  if (productionConfig.api.timeout < 1000) {
    errors.push('API timeout must be at least 1000ms');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export configuration validation on module load
const validation = validateProductionConfig();
if (!validation.valid) {
  console.error('❌ Production configuration validation failed:', validation.errors);
  process.exit(1);
}

export default productionConfig;