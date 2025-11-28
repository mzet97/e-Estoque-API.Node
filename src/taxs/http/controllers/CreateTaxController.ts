import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CreateTaxUseCase from '../../useCases/createTax/CreateTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

export default class CreateTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createTaxUseCase = container.resolve(CreateTaxUseCase)
    const viewModel = request.body as TaxViewModel

    const result = await createTaxUseCase.execute(viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_TAX_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data)
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}