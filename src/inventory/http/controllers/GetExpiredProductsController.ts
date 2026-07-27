import { Request, Response } from 'express'
import { container } from 'tsyringe'
import GetExpiredProductsUseCase from '../../useCases/getExpiredProducts/GetExpiredProductsUseCase'

export default class GetExpiredProductsController {
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { companyId } = req.params
      const { daysAhead, page, pageSize } = req.query

      const useCase = container.resolve(GetExpiredProductsUseCase)

      const result = await useCase.execute({
        companyId,
        daysAhead: daysAhead ? parseInt(daysAhead as string) : 30,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20
      })

      return res.status(200).json({
        success: true,
        message: 'Produtos expirados obtidos com sucesso',
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter produtos expirados',
        errors: [{ code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Erro desconhecido' }]
      })
    }
  }
}
