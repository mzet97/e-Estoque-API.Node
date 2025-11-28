import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    roles: string[]
    companyId?: string
  }
  requestId: string
}

export interface JWTPayload {
  sub: string
  email: string
  roles: string[]
  companyId?: string
  iat: number
  exp: number
}

// Middleware de autenticação JWT
export function authenticateJWT(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso é obrigatório',
      errors: [{ code: 'MISSING_TOKEN', message: 'Token de acesso não fornecido' }]
    })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não está configurado')
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
      companyId: decoded.companyId
    }

    next()
  } catch (error) {
    console.error('JWT verification failed', { error: error instanceof Error ? error.message : error })
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        errors: [{ code: 'TOKEN_EXPIRED', message: 'Token de acesso expirado' }]
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        errors: [{ code: 'INVALID_TOKEN', message: 'Token de acesso inválido' }]
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Erro ao validar token' }]
    })
  }
}

// Middleware para verificar roles
export function requireRole(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        errors: [{ code: 'UNAUTHENTICATED', message: 'Autenticação obrigatória' }]
      })
    }

    const userRoles = req.user.roles || []
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
        errors: [{ 
          code: 'INSUFFICIENT_PERMISSIONS', 
          message: 'Permissões insuficientes para acessar este recurso' 
        }]
      })
    }

    next()
  }
}

// Função utilitária para gerar tokens JWT
export function generateTokens(user: { id: string, email: string, roles: string[], companyId?: string }) {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret'
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h'
  const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    companyId: user.companyId
  }

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
  const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: refreshTokenExpiresIn })

  return { accessToken, refreshToken, expiresIn: jwtExpiresIn }
}

// Função para verificar se o usuário tem uma role específica
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole)
}

// Função para verificar se o usuário tem qualquer uma das roles especificadas
export function hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
  return allowedRoles.some(role => userRoles.includes(role))
}

// Função para verificar se o usuário tem todas as roles especificadas
export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role))
}
