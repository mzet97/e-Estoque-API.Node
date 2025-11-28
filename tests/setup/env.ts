process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.PORT = '0';
process.env.REDIS_URL = 'redis://localhost:6379/15';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/estocke_test';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET = 'test-bucket';
process.env.GRAFANA_URL = 'http://localhost:3001';
process.env.PROMETHEUS_URL = 'http://localhost:9090';

const { config } = require('dotenv');
config({ path: '.env.test' });