/**
 * Configuration Manager for E-Estoque API
 * Loads environment-specific configuration
 */

import { productionConfig } from './production';
import { stagingConfig } from './staging';
import { developmentConfig } from './development';

// Environment detection
const getEnvironment = (): string => {
  const env = process.env.NODE_ENV?.toLowerCase();
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    case 'test':
      return 'test';
    case 'development':
    case 'dev':
    default:
      return 'development';
  }
};

// Configuration factory
const createConfig = (environment: string) => {
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'test':
      return {
        ...developmentConfig,
        NODE_ENV: 'test',
        database: {
          ...developmentConfig.database,
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
          logging: false
        },
        logging: {
          ...developmentConfig.logging,
          level: 'error',
          enableConsole: false,
          enableFile: false
        },
        features: {
          ...developmentConfig.features,
          enableDebugLogs: false,
          enableDevTools: false
        }
      };
    case 'development':
    default:
      return developmentConfig;
  }
};

// Main configuration object
export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  database: any;
  redis: any;
  rabbitMQ: any;
  jwt: any;
  rateLimit: any;
  circuitBreaker: any;
  logging: any;
  metrics: any;
  health: any;
  security: any;
  email: any;
  fileStorage: any;
  api: any;
  loadBalancing: any;
  monitoring: any;
  cache: any;
  features: any;
  [key: string]: any;
}

// Get current configuration
const environment = getEnvironment();
const config: AppConfig = createConfig(environment);

// Add metadata
Object.defineProperty(config, '_metadata', {
  value: {
    environment,
    loadedAt: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  },
  enumerable: false
});

// Configuration utilities
export const configUtils = {
  // Get configuration value with fallback
  get: (path: string, fallback?: any): any => {
    const keys = path.split('.');
    let value: any = config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    
    return value;
  },

  // Check if feature is enabled
  isFeatureEnabled: (feature: string): boolean => {
    return config.features[feature] === true;
  },

  // Get service configuration
  getServiceConfig: (service: string): any => {
    const serviceConfigs: Record<string, string> = {
      database: 'database',
      redis: 'redis',
      rabbitmq: 'rabbitMQ',
      email: 'email',
      fileStorage: 'fileStorage'
    };

    const configKey = serviceConfigs[service];
    return configKey ? config[configKey] : null;
  },

  // Get environment info
  getEnvironmentInfo: () => ({
    environment: config.NODE_ENV,
    isDevelopment: config.NODE_ENV === 'development',
    isStaging: config.NODE_ENV === 'staging',
    isProduction: config.NODE_ENV === 'production',
    isTest: config.NODE_ENV === 'test',
    version: process.env.npm_package_version || '1.0.0'
  }),

  // Validate configuration for current environment
  validate: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic validation
    if (!config.PORT || config.PORT <= 0) {
      errors.push('PORT must be a positive number');
    }

    if (!config.database?.url) {
      errors.push('DATABASE_URL is required');
    }

    if (!config.redis?.url) {
      errors.push('REDIS_URL is required');
    }

    if (!config.jwt?.secret) {
      errors.push('JWT_SECRET is required');
    }

    // Environment-specific validation
    if (config.NODE_ENV === 'production') {
      if (!config.rabbitMQ?.url) {
        errors.push('RABBITMQ_URL is required in production');
      }

      if (!config.security?.cors?.origin?.length) {
        errors.push('CORS_ORIGIN is required in production');
      }

      if (!config.logging?.enableFile) {
        errors.push('File logging should be enabled in production');
      }

      if (config.logging?.enableConsole) {
        errors.push('Console logging should be disabled in production');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Get all configuration (excluding sensitive data)
  getSafeConfig: (): Partial<AppConfig> => {
    const sensitiveKeys = [
      'database.url',
      'jwt.secret',
      'email.sendgrid.apiKey',
      'email.ses.secretAccessKey',
      'fileStorage.s3.secretAccessKey'
    ];

    const clone = JSON.parse(JSON.stringify(config));
    
    // Remove sensitive data
    for (const key of sensitiveKeys) {
      const keys = key.split('.');
      let obj = clone;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj && typeof obj === 'object' && keys[i] in obj) {
          obj = obj[keys[i]];
        } else {
          obj = undefined;
          break;
        }
      }
      
      if (obj && typeof obj === 'object' && keys[keys.length - 1] in obj) {
        obj[keys[keys.length - 1]] = '[REDACTED]';
      }
    }

    return clone;
  }
};

// Configuration middleware for Express
export const configMiddleware = (req: any, res: any, next: any) => {
  // Add configuration to request object
  req.config = config;
  req.configUtils = configUtils;
  
  // Add correlation ID from config or generate one
  req.correlationId = req.headers['x-correlation-id'] || 
                     `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  next();
};

// Export main configuration and utilities
export default config;

// Environment-specific exports
export {
  productionConfig,
  stagingConfig,
  developmentConfig,
  getEnvironment,
  createConfig
};

// Type exports for better IDE support
export type {
  AppConfig
};