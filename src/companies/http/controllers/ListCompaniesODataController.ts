import { Request, Response } from 'express'
import { inject, injectable } from 'tsyringe'
import ListCompaniesODataUseCase from '../../useCases/listCompaniesOData/ListCompaniesODataUseCase'
import IController from '@shared/useCases/IController'

@injectable()
export default class ListCompaniesODataController implements IController {
  constructor(
    @inject(ListCompaniesODataUseCase.name)
    private listCompaniesODataUseCase: ListCompaniesODataUseCase,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log('ListCompaniesODataController.handle:', req.query)

      const oDataQuery = req.oDataQuery
      const userId = (req as any).user?.id

      const result = await this.listCompaniesODataUseCase.execute({
        oDataQuery,
        userId,
        cacheEnabled: true,
        includeCount: oDataQuery?.count || false
      })

      if (!result.success) {
        return res.status(400).json(result)
      }

      // If $count was requested, return count directly
      if (oDataQuery?.count) {
        return res.json({
          '@odata.count': result.data?.total || 0
        })
      }

      return res.json(result)

    } catch (error) {
      console.error('Error in ListCompaniesODataController:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao listar empresas',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
