import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCustomerAddressUseCase from '../../useCases/createCustomerAddress/CreateCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

export default class CreateCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCustomerAddressUseCase = container.resolve(CreateCustomerAddressUseCase)
    const viewModel = request.body as CustomerAddressViewModel

    const result = await createCustomerAddressUseCase.execute(viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data)
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}