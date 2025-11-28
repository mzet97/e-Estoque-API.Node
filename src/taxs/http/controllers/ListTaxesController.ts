import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListTaxesUseCase from '../../useCases/listTaxes/ListTaxesUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

export default class ListTaxesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listTaxesUseCase = container.resolve(ListTaxesUseCase)
    
    const filters = {
      name: request.query.name as string,
      idCategory: request.query.idCategory as string,
      percentage: request.query.percentage ? parseFloat(request.query.percentage as string) : undefined,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }
    
    const result = await listTaxesUseCase.execute(filters)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_TAXES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: TaxViewModel.fromTaxList(result.data)
    }
    
    response.status(200).json(viewModelResult)
  }
}