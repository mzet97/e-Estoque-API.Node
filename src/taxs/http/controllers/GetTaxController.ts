import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetTaxUseCase from '../../useCases/getTax/GetTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

export default class GetTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCategory = request.query.includeCategory !== 'false'
    const getTaxUseCase = container.resolve(GetTaxUseCase)
    
    const result = await getTaxUseCase.execute(id)

    if (!result.success) {
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'TAX_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data, includeCategory)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}