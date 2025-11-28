import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateTaxUseCase from '../../useCases/updateTax/UpdateTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

export default class UpdateTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as TaxViewModel
    const updateTaxUseCase = container.resolve(UpdateTaxUseCase)

    const result = await updateTaxUseCase.execute(id, viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_TAX_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}