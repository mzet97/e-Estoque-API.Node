/**
 * Development Environment Configuration
 * E-Estoque API - Development Settings
 */

export const developmentConfig = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://estoque_user:estoque_password_123@localhost:5432/estoque_db',
    ssl: {
      rejectUnauthorized: false
    },
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 300000,
      createTimeoutMillis: 60000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    logging: true, // Enable detailed SQL logging
    sync: {
      force: false, // Don't force sync in development
      alter: false  // Don't alter schema automatically
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    retryDelay: 100,
    maxRetriesPerRequest: 3,
    maxRetriesPerConnection: 3,
    connectTimeout: 5000,
    commandTimeout: 3000,
    lazyConnect: true // Connect lazily in development
  },

  // RabbitMQ Configuration
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || 'amqp://estoque_user:estoque_password_123@localhost:5672',
    options: {
      heartbeat: 30,
      reconnectTimeInSeconds: 30,
      prefetch: 1, // Single message at a time for development
      durable: false, // Don't persist messages in development
      autoDelete: true,
      arguments: {}
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'development-jwt-secret-key',
    issuer: process.env.JWT_ISSUER || 'eestoque-dev',
    audience: process.env.JWT_AUDIENCE || 'eestoque-dev-client',
    expiresIn: '24h', // Longer expiry for development
    refreshExpiresIn: '30d',
    algorithm: 'HS256'
  },

  // Rate Limiting
  rateLimit: {
    defaultLimit: 10000, // Very high limits for development
    tierLimits: {
      free: 1000,
      basic: 10000,
      premium: 50000,
      admin: -1 // unlimited
    },
    windowMs: 60000,
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 10,
    resetTimeout: 10000, // Reset quickly in development
    monitorInterval: 5000, // Monitor frequently
    timeout: 10000, // Longer timeout for development
    errorThresholdPercentage: 80,
    volumeThreshold: 20
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    serviceName: 'eestoque-dev-api',
    environment: 'development',
    enableConsole: true,
    enableFile: false, // Don't log to files in development
    format: 'simple', // Human readable format
    includeStack: true,
    includeHeaders: true,
    includeBodies: true,
    sensitiveFields: ['password', 'token', 'secret'],
    logRequests: true,
    logErrors: true,
    logPerformance: true,
    colorize: true
  },

  // Metrics Configuration
  metrics: {
    serviceName: 'eestoque-dev-api',
    environment: 'development',
    port: parseInt(process.env.METRICS_PORT || '9092', 10),
    collectDefaultMetrics: true,
    collectDefaultProcessMetrics: true,
    collectGcMetrics: true,
    collectHeapStatsMetrics: true,
    collectEventLoopMetrics: true,
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    defaultLabels: {
      service: 'eestoque-dev-api',
      environment: 'development',
      version: process.env.npm_package_version || '1.0.0-dev'
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
        timeout: 30000 // Longer timeout for development
      },
      redis: {
        enabled: true,
        timeout: 10000
      },
      rabbitmq: {
        enabled: true,
        timeout: 30000
      },
      disk: {
        enabled: false // Disable disk checks in development
      },
      memory: {
        enabled: true,
        threshold: 95 // Higher threshold for development
      }
    }
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8080'
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
      contentSecurityPolicy: false, // Disable CSP in development
      crossOriginEmbedderPolicy: false
    }
  },

  // Email Configuration
  email: {
    provider: 'mock', // Always use mock provider in development
    templates: {
      welcome: 'welcome-template-dev',
      passwordReset: 'password-reset-template-dev',
      orderConfirmation: 'order-confirmation-template-dev',
      lowStock: 'low-stock-template-dev'
    },
    from: {
      name: 'E-Estoque Dev',
      address: 'dev@eestoque.com'
    },
    mock: {
      enabled: true,
      logToConsole: true,
      saveToFile: true,
      filePath: './logs/emails'
    }
  },

  // File Storage Configuration
  fileStorage: {
    provider: 'local', // Use local storage in development
    local: {
      uploadDir: './uploads',
      publicDir: './public',
      createDirectories: true
    },
    limits: {
      maxFileSize: 50 * 1024 * 1024, // 50MB for development
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/json'
      ]
    }
  },

  // API Configuration
  api: {
    version: 'v1',
    defaultVersion: 'v1',
    supportedVersions: ['v1'],
    timeout: 120000, // 2 minutes for development
    compression: {
      threshold: 256, // Compress small responses
      level: 1
    },
    pagination: {
      defaultLimit: 10, // Smaller pages for development
      maxLimit: 50,
      maxPages: 100
    },
    cache: {
      enabled: false // Disable API caching in development
    }
  },

  // Load Balancing
  loadBalancing: {
    strategies: ['round-robin'],
    defaultStrategy: 'round-robin',
    healthCheckInterval: 10000, // 10 seconds
    healthCheckTimeout: 2000,   // 2 seconds
    healthCheckRetries: 3,
    circuitBreakerEnabled: false, // Disable in development
    timeout: 30000 // 30 seconds
  },

  // Monitoring & Observability
  monitoring: {
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    samplingRate: 1.0, // 100% sampling for development
    tracesEndpoint: process.env.TRACES_ENDPOINT || '',
    metricsEndpoint: process.env.METRICS_ENDPOINT || '',
    alerting: {
      enabled: false, // Disable alerting in development
      channels: [],
      thresholds: {}
    }
  },

  // Cache Configuration
  cache: {
    defaultTTL: 60,      // 1 minute
    maxTTL: 300,         // 5 minutes
    namespaces: {
      users: 120,        // 2 minutes
      products: 60,      // 1 minute
      orders: 30,        // 30 seconds
      inventory: 15,     // 15 seconds
      sessions: 300      // 5 minutes
    },
    strategies: {
      read: 'cache-first',
      write: 'write-through',
      invalidate: 'no-cache'
    }
  },

  // Feature Flags
  features: {
    enableNewAPI: true,
    enableBetaFeatures: true,
    enableMaintenanceMode: false,
    enableRateLimiting: false, // Disable in development
    enableCircuitBreaker: false, // Disable in development
    enableMetrics: true,
    enableTracing: true,
    enableDebugLogs: true,
    enableHotReload: true,
    enableDevTools: true
  },

  // Database Seeding
  seeding: {
    enabled: true,
    autoSeed: true,
    dropBeforeSeed: true, // Drop and recreate for clean development
    seedPath: './seeders',
    sampleData: {
      users: 10,
      products: 50,
      categories: 5,
      orders: 20,
      inventory: 50
    }
  },

  // Hot Reload Configuration
  hotReload: {
    enabled: true,
    watchPaths: ['./src', './config'],
    ignorePaths: ['./node_modules', './dist', './coverage', './.git'],
    delay: 1000
  },

  // Development Tools
  devTools: {
    enableSwagger: true,
    swaggerPath: '/api-docs',
    enableGraphQL: false,
    enableWebSocket: false,
    enableSocketIO: false,
    enableDebugMiddleware: true,
    enableRequestLogging: true,
    enableErrorTracing: true
  }
};

// Validation function
export function validateDevelopmentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Development has minimal requirements
  const optional = [
    'DATABASE_URL',
    'REDIS_URL',
    'RABBITMQ_URL'
  ];
  
  optional.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`⚠️ Missing optional environment variable: ${envVar}`);
    }
  });
  
  return {
    valid: true, // Development doesn't have strict requirements
    errors: []
  };
}

// Export configuration validation on module load
const validation = validateDevelopmentConfig();
if (!validation.valid) {
  console.warn('⚠️ Development configuration validation warnings:', validation.errors);
}

export default developmentConfig;