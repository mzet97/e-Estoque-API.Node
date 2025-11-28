import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCustomerUseCase from '../../useCases/createCustomer/CreateCustomerUseCase'
import CreateCustomerViewModel from '../../viewModels/CreateCustomerViewModel'
import ShowCustomerViewModel from '../../viewModels/ShowCustomerViewModel'

export default class CreateCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCustomerUseCase = container.resolve(CreateCustomerUseCase)
    const viewModel = request.body as CreateCustomerViewModel

    console.log('CreateCustomerController.handle:', { name: viewModel.name, email: viewModel.email })
    
    const result = await createCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCustomerController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('CreateCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}