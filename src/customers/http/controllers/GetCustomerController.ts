import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCustomerUseCase from '../useCases/getCustomer/GetCustomerUseCase'
import ShowCustomerViewModel from '../viewModels/ShowCustomerViewModel'

export default class GetCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const getCustomerUseCase = container.resolve(GetCustomerUseCase)
    const viewModel = {
      customerId: request.params.id,
      includeAddress: request.query.includeAddress === 'true'
    }

    console.log('GetCustomerController.handle:', { id: viewModel.customerId, includeAddress: viewModel.includeAddress })
    
    const result = await getCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('GetCustomerController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'GET_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('GetCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}