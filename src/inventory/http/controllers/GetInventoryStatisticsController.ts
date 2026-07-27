import { Request, Response } from 'express'
import { container } from 'tsyringe'
import GetInventoryStatisticsUseCase from '../../useCases/getStatistics/GetInventoryStatisticsUseCase'

export default class GetInventoryStatisticsController {
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { companyId } = req.params
      const { startDate, endDate } = req.query

      const useCase = container.resolve(GetInventoryStatisticsUseCase)

      const result = await useCase.execute({
        companyId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      })

      return res.status(200).json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: result
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        errors: [{ code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Erro desconhecido' }]
      })
    }
  }
}
