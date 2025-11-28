import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetCustomerAddressUseCase from '../../useCases/getCustomerAddress/GetCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

export default class GetCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCustomer = request.query.includeCustomer !== 'false'
    const getCustomerAddressUseCase = container.resolve(GetCustomerAddressUseCase)
    
    const result = await getCustomerAddressUseCase.execute(id)

    if (!result.success) {
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CUSTOMER_ADDRESS_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data, includeCustomer)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}