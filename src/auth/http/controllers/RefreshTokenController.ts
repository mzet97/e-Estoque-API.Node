import { Request, Response } from 'express'
import { container } from 'tsyringe'
import RefreshTokenUseCase from '../../useCases/refreshToken/RefreshTokenUseCase'

export default class RefreshTokenController {
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body

      const refreshTokenUseCase = container.resolve(RefreshTokenUseCase)

      const result = await refreshTokenUseCase.execute({ refreshToken })

      return res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor'

      if (message.includes('inválido') || message.includes('expirado') || message.includes('não encontrado')) {
        return res.status(401).json({
          success: false,
          message,
          errors: [{ code: 'TOKEN_ERROR', message }]
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
