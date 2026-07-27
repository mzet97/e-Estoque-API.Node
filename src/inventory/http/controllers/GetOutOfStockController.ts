import { Request, Response } from 'express'
import { container } from 'tsyringe'
import GetOutOfStockUseCase from '../../useCases/getOutOfStock/GetOutOfStockUseCase'

export default class GetOutOfStockController {
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { companyId } = req.params
      const { location, warehouseZone, page, pageSize } = req.query

      const useCase = container.resolve(GetOutOfStockUseCase)

      const result = await useCase.execute({
        companyId,
        location: location as string,
        warehouseZone: warehouseZone as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20
      })

      return res.status(200).json({
        success: true,
        message: 'Produtos sem estoque obtidos com sucesso',
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter produtos sem estoque',
        errors: [{ code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Erro desconhecido' }]
      })
    }
  }
}
