import { Request, Response } from 'express'
import { inject, injectable } from 'tsyringe'
import ListCustomersODataUseCase from '../../useCases/listCustomersOData/ListCustomersODataUseCase'
import IController from '@shared/useCases/IController'

@injectable()
export default class ListCustomersODataController implements IController {
  constructor(
    @inject(ListCustomersODataUseCase.name)
    private listCustomersODataUseCase: ListCustomersODataUseCase,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log('ListCustomersODataController.handle:', req.query)

      const oDataQuery = req.oDataQuery
      const userId = (req as any).user?.id

      const result = await this.listCustomersODataUseCase.execute({
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
      console.error('Error in ListCustomersODataController:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao listar clientes',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
