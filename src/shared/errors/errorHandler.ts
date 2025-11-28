import { Request, Response, NextFunction } from 'express'
import { LoggedRequest } from '@shared/log/logger.middleware'
import { logError } from '@shared/log/logger.middleware'

// Tipos de erro customizados
export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean
  public details?: any

  constructor(
    message: string, 
    statusCode: number = 500, 
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', true, details)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details)
  }
}

// Interface para erros de validação
interface ValidationErrorDetail {
  field: string
  message: string
  code: string
  value?: any
}

// Interface para resposta de erro
interface ErrorResponse {
  success: false
  data: null
  message: string
  errors: ValidationErrorDetail[]
  timestamp: string
  requestId: string
  path: string
  method: string
}

// Middleware de tratamento de erros
export function errorHandler(
  error: Error | AppError,
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Erro interno do servidor'
  let details: any = undefined

  // Log do erro
  logError(req.log, error, {
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  })

  // Se é um erro operacional conhecido
  if (error instanceof AppError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
    details = error.details
  } else if (error.name === 'ValidationError') {
    // Erro de validação do Mongoose/TypeORM
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Dados inválidos'
    details = extractValidationErrors(error)
  } else if (error.name === 'CastError') {
    // Erro de cast do Mongoose
    statusCode = 400
    code = 'INVALID_ID'
    message = 'ID inválido'
  } else if (error.name === 'JsonWebTokenError') {
    // Erro de JWT
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Token inválido'
  } else if (error.name === 'TokenExpiredError') {
    // Token expirado
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Token expirado'
  } else if (error.message.includes('duplicate key')) {
    // Erro de duplicação no banco
    statusCode = 409
    code = 'DUPLICATE_ENTRY'
    message = 'Registro já existe'
  }

  // Montar resposta de erro padronizada
  const errorResponse: ErrorResponse = {
    success: false,
    data: null,
    message,
    errors: details || [{
      code,
      message: code === 'INTERNAL_ERROR' ? 'Erro interno do servidor' : message,
      field: 'general'
    }],
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.url,
    method: req.method
  }

  // Em ambiente de desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development' && error instanceof AppError === false) {
    errorResponse.errors[0].message = `${message}: ${error.message}`
  }

  res.status(statusCode).json(errorResponse)
}

// Middleware para capturar rotas não encontradas
export function notFoundHandler(req: LoggedRequest, res: Response): void {
  const message = `Rota ${req.method} ${req.url} não encontrada`
  
  req.log.warn({ 
    method: req.method, 
    url: req.url, 
    userAgent: req.headers['user-agent'] 
  }, 'Route not found')

  const errorResponse: ErrorResponse = {
    success: false,
    data: null,
    message: 'Endpoint não encontrado',
    errors: [{
      code: 'NOT_FOUND',
      message: message,
      field: 'path'
    }],
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.url,
    method: req.method
  }

  res.status(404).json(errorResponse)
}

// Função para extrair erros de validação
function extractValidationErrors(error: any): ValidationErrorDetail[] {
  if (error.errors) {
    return Object.keys(error.errors).map(field => ({
      field,
      message: error.errors[field].message,
      code: 'VALIDATION_ERROR',
      value: error.errors[field].value
    }))
  }
  
  return [{
    field: 'general',
    message: error.message,
    code: 'VALIDATION_ERROR'
  }]
}

// Função para criar erros de validação a partir de Joi
export function createValidationError(joiError: any): ValidationError {
  const errors = joiError.details.map((detail: any) => ({
    field: detail.path.join('.'),
    message: detail.message,
    code: 'VALIDATION_ERROR',
    value: detail.context?.value
  }))
  
  return new ValidationError('Dados inválidos', errors)
}

// Wrapper async para capturar erros em use cases
export function asyncHandler(
  fn: (req: LoggedRequest, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: LoggedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Função para validar se erro é operacional (esperado)
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  errorHandler,
  notFoundHandler,
  createValidationError,
  asyncHandler,
  isOperationalError
}
