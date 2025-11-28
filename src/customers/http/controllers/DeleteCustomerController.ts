import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCustomerUseCase from '../useCases/deleteCustomer/DeleteCustomerUseCase'
import { DeleteCustomerViewModel } from '../useCases/deleteCustomer/DeleteCustomerUseCase'

export default class DeleteCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const deleteCustomerUseCase = container.resolve(DeleteCustomerUseCase)
    const viewModel = new DeleteCustomerViewModel(
      request.params.id,
      request.query.hardDelete === 'true'
    )

    console.log('DeleteCustomerController.handle:', { id: viewModel.customerId, hardDelete: viewModel.hardDelete })
    
    const result = await deleteCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('DeleteCustomerController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCustomerController.handle:', { id: viewModel.customerId, message: result.message })
    
    response.status(204).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}