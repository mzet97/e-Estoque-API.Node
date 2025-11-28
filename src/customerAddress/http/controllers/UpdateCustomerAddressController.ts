import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateCustomerAddressUseCase from '../../useCases/updateCustomerAddress/UpdateCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

export default class UpdateCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as CustomerAddressViewModel
    const updateCustomerAddressUseCase = container.resolve(UpdateCustomerAddressUseCase)

    const result = await updateCustomerAddressUseCase.execute(id, viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}