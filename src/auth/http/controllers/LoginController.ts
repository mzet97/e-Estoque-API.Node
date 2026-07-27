import { Request, Response } from 'express'
import { container } from 'tsyringe'
import LoginUseCase from '../../useCases/login/LoginUseCase'

export default class LoginController {
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body

      const loginUseCase = container.resolve(LoginUseCase)

      const result = await loginUseCase.execute({ email, password })

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor'

      if (message.includes('inválidos') || message.includes('bloqueada') || message.includes('desativada')) {
        return res.status(401).json({
          success: false,
          message,
          errors: [{ code: 'AUTH_ERROR', message }]
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: [{ code: 'INTERNAL_ERROR', message }]
      })
    }
  }
}
