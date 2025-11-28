import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCustomerUseCase from '../useCases/updateCustomer/UpdateCustomerUseCase'
import UpdateCustomerViewModel from '../viewModels/UpdateCustomerViewModel'
import ShowCustomerViewModel from '../viewModels/ShowCustomerViewModel'

export default class UpdateCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const updateCustomerUseCase = container.resolve(UpdateCustomerUseCase)
    const viewModel = {
      ...request.body,
      customerId: request.params.id
    } as UpdateCustomerViewModel

    console.log('UpdateCustomerController.handle:', { id: viewModel.customerId, name: viewModel.name })
    
    const result = await updateCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('UpdateCustomerController.handle:', { message: result.message })
      const statusCode = result.message.includes('não encontrado') ? 404 : 400
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('UpdateCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}