import { Router } from 'express'
import LoginController from '../controllers/LoginController'
import RefreshTokenController from '../controllers/RefreshTokenController'
import { loginValidation, refreshTokenValidation } from '../../validations/authValidation'

const authRouter = Router()

const loginController = new LoginController()
const refreshTokenController = new RefreshTokenController()

// POST /auth/login - Autenticar usuário
authRouter.post(
  '/login',
  loginValidation,
  loginController.handle.bind(loginController)
)

// POST /auth/refresh-token - Renovar token de acesso
authRouter.post(
  '/refresh-token',
  refreshTokenValidation,
  refreshTokenController.handle.bind(refreshTokenController)
)

export { authRouter }
