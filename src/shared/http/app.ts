import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { celebrate, Joi, Segments, errors as celebrateErrors } from 'celebrate'

// Import our custom middlewares
import { httpLogger, correlationId } from '@shared/log/logger.middleware'
import { 
  errorHandler, 
  notFoundHandler, 
  AppError,
  asyncHandler 
} from '@shared/errors/errorHandler'
import { 
  basicHealthCheck, 
  detailedHealthCheck, 
  readinessCheck, 
  livenessCheck 
} from '@shared/http/middlewares/healthCheck'
import { setupSwagger } from '@shared/http/swagger.config'

// Import routes
import { routes } from './routes'

// Create Express app
const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://eestoque.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Correlation ID middleware
app.use(correlationId)

// Logging middleware (must be before routes)
app.use(httpLogger)

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Muitas requisições, tente novamente em alguns minutos',
    errors: [{
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit excedido'
    }]
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use('/api/', limiter)

// Health check endpoints
app.get('/health', basicHealthCheck)
app.get('/health/detailed', detailedHealthCheck)
app.get('/health/readiness', readinessCheck)
app.get('/health/liveness', livenessCheck)

// Swagger documentation
setupSwagger(app)

// API routes
app.use('/api/v1', routes)

// Handle celebrate validation errors
app.use(celebrateErrors)

// Handle 404 routes
app.use('*', notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export { app }
