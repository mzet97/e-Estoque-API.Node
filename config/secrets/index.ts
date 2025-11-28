/**
 * Secrets Configuration and Management
 * Complete secrets configuration for E-Estoque API
 */

export const secretsConfig = {
  // Development configuration
  development: {
    provider: 'local' as const,
    local: {
      enabled: true,
      encryptAtRest: false,
      keyRotationEnabled: false
    },
    // Load secrets from environment variables for development
    environmentVariables: {
      SECRET_DATABASE_URL: 'postgresql://estoque_user:estoque_password_123@localhost:5432/estoque_db',
      SECRET_REDIS_URL: 'redis://localhost:6379/0',
      SECRET_RABBITMQ_URL: 'amqp://estoque_user:estoque_password_123@localhost:5672',
      SECRET_JWT_SECRET: 'development-jwt-secret-key',
      SECRET_SENDGRID_API_KEY: 'development-sendgrid-key',
      SECRET_AWS_ACCESS_KEY_ID: 'development-aws-key',
      SECRET_AWS_SECRET_ACCESS_KEY: 'development-aws-secret'
    }
  },

  // Staging configuration
  staging: {
    provider: 'aws-secrets-manager' as const,
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      kmsKeyId: process.env.AWS_KMS_KEY_ID,
      prefix: 'eestoque/staging',
      timeout: 10000
    },
    // Staging-specific secrets
    secretNames: [
      'eestoque/staging/database-url',
      'eestoque/staging/redis-url',
      'eestoque/staging/rabbitmq-url',
      'eestoque/staging/jwt-secret',
      'eestoque/staging/sendgrid-api-key',
      'eestoque/staging/aws-credentials',
      'eestoque/staging/file-storage-credentials',
      'eestoque/staging/external-service-credentials'
    ],
    rotationSchedule: {
      jwtSecrets: '30d',
      databaseCredentials: '60d',
      apiKeys: '90d',
      externalCredentials: '45d'
    }
  },

  // Production configuration
  production: {
    provider: 'hashiCorp-vault' as const,
    vault: {
      url: process.env.VAULT_URL || 'https://vault.eestoque.com',
      token: process.env.VAULT_TOKEN || '',
      mountPoint: 'secret',
      timeout: 15000
    },
    // Production secrets structure
    secretPaths: [
      'secret/eestoque/database/credentials',
      'secret/eestoque/cache/credentials',
      'secret/eestoque/messaging/credentials',
      'secret/eestoque/auth/jwt',
      'secret/eestoque/email/providers',
      'secret/eestoque/storage/providers',
      'secret/eestoque/external/apis',
      'secret/eestoque/monitoring/credentials',
      'secret/eestoque/ssl/certificates'
    ],
    // Enhanced rotation policies
    rotationPolicy: {
      criticalSecrets: '15d',    // JWT, database passwords
      importantSecrets: '30d',   // API keys, external credentials
      standardSecrets: '60d',    // Service credentials
      certificates: '365d'       // SSL certificates
    },
    // Access control
    accessControl: {
      roles: {
        'application': ['read', 'write'],
        'admin': ['read', 'write', 'delete', 'rotate'],
        'rotation-service': ['write', 'rotate']
      },
      policies: [
        'eestoque-application-policy',
        'eestoque-admin-policy',
        'eestoque-rotation-policy'
      ]
    }
  },

  // Alternative production configuration (AWS)
  productionAWS: {
    provider: 'aws-secrets-manager' as const,
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      kmsKeyId: process.env.AWS_KMS_KEY_ID || 'alias/eestoque-secrets-kms',
      prefix: 'eestoque/production',
      timeout: 15000
    },
    secretStructure: {
      database: 'eestoque/production/database/credentials',
      cache: 'eestoque/production/cache/credentials',
      messaging: 'eestoque/production/messaging/credentials',
      auth: 'eestoque/production/auth/jwt-secret',
      email: 'eestoque/production/email/providers',
      storage: 'eestoque/production/storage/credentials',
      external: 'eestoque/production/external/services',
      monitoring: 'eestoque/production/monitoring/credentials'
    },
    rotationConfiguration: {
      enableAutomaticRotation: true,
      rotationRules: {
        'eestoque/production/auth/jwt-secret': {
          rotationDays: 30,
          rotationRules: 'custom'
        },
        'eestoque/production/database/credentials': {
          rotationDays: 60,
          rotationRules: 'default'
        }
      }
    }
  },

  // Azure production configuration
  productionAzure: {
    provider: 'azure-key-vault' as const,
    azure: {
      vaultName: process.env.AZURE_KEY_VAULT_NAME || 'eestoque-production-kv',
      tenantId: process.env.AZURE_TENANT_ID || '',
      clientId: process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || ''
    },
    secretNames: [
      'database-connection-string',
      'redis-connection-string',
      'rabbitmq-connection-string',
      'jwt-secret',
      'sendgrid-api-key',
      'aws-credentials',
      'storage-credentials',
      'external-service-keys'
    ]
  },

  // GCP production configuration
  productionGCP: {
    provider: 'gcp-secret-manager' as const,
    gcp: {
      projectId: process.env.GCP_PROJECT_ID || 'eestoque-production',
      location: 'us-central1',
      timeout: 15000
    },
    secretNames: [
      'eestoque/database/credentials',
      'eestoque/cache/credentials',
      'eestoque/messaging/credentials',
      'eestoque/auth/jwt-secret',
      'eestoque/email/providers',
      'eestoque/storage/credentials'
    ]
  }
};

// Secrets validation rules
export const secretsValidation = {
  // Required secrets per environment
  requiredSecrets: {
    development: [
      'DATABASE_URL',
      'REDIS_URL',
      'RABBITMQ_URL',
      'JWT_SECRET'
    ],
    staging: [
      'DATABASE_URL',
      'REDIS_URL',
      'RABBITMQ_URL',
      'JWT_SECRET',
      'SENDGRID_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ],
    production: [
      'DATABASE_URL',
      'REDIS_URL',
      'RABBITMQ_URL',
      'JWT_SECRET',
      'SENDGRID_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'S3_BUCKET',
      'SSL_CERTIFICATE',
      'SSL_PRIVATE_KEY'
    ]
  },

  // Secret format validation
  formatRules: {
    'DATABASE_URL': /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/,
    'REDIS_URL': /^redis:\/\/([^:]+):([^@]+@)?[^:]+:\d+(\/\d+)?$/,
    'RABBITMQ_URL': /^amqp:\/\/[^:]+:[^@]+@[^:]+:\d+(\/.*)?$/,
    'JWT_SECRET': /^.{32,}$/, // At least 32 characters
    'EMAIL': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'AWS_ACCESS_KEY_ID': /^AKIA[0-9A-Z]{16}$/,
    'SSL_CERTIFICATE': /^-----BEGIN CERTIFICATE-----/
  },

  // Rotation requirements
  rotationRequirements: {
    'JWT_SECRET': {
      maxAge: 30, // days
      required: true
    },
    'DATABASE_PASSWORD': {
      maxAge: 90,
      required: true
    },
    'API_KEYS': {
      maxAge: 60,
      required: true
    },
    'SSL_CERTIFICATES': {
      maxAge: 365,
      required: true
    }
  }
};

// Default configuration for current environment
export const getSecretsConfig = (environment: string = process.env.NODE_ENV || 'development') => {
  const config = secretsConfig[environment];
  
  if (!config) {
    throw new Error(`Unsupported environment for secrets: ${environment}`);
  }
  
  return config;
};

// Validation function
export function validateSecretsConfig(): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const environment = process.env.NODE_ENV || 'development';
  const config = getSecretsConfig(environment);
  
  // Validate provider
  if (!config.provider) {
    errors.push('Secrets provider is required');
  }
  
  // Validate provider-specific configuration
  switch (config.provider) {
    case 'aws-secrets-manager':
      if (!config.aws?.region) {
        errors.push('AWS region is required for AWS Secrets Manager');
      }
      break;
    case 'hashiCorp-vault':
      if (!config.vault?.url || !config.vault?.token) {
        errors.push('Vault URL and token are required');
      }
      break;
    case 'azure-key-vault':
      if (!config.azure?.vaultName) {
        errors.push('Azure Key Vault name is required');
      }
      break;
    case 'gcp-secret-manager':
      if (!config.gcp?.projectId) {
        errors.push('GCP project ID is required');
      }
      break;
    case 'local':
      if (!config.local?.enabled) {
        warnings.push('Local secrets provider is enabled in non-development environment');
      }
      break;
  }
  
  // Validate required secrets exist
  const requiredSecrets = secretsValidation.requiredSecrets[environment];
  if (requiredSecrets) {
    requiredSecrets.forEach(secret => {
      if (!process.env[secret]) {
        errors.push(`Required secret not found: ${secret}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Export specific configurations
export {
  secretsConfig as default
};