import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListCustomerAddressesUseCase from '../../useCases/listCustomerAddresses/ListCustomerAddressesUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

export default class ListCustomerAddressesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCustomerAddressesUseCase = container.resolve(ListCustomerAddressesUseCase)
    
    const filters = {
      customerId: request.query.customerId as string,
      type: request.query.type as any,
      city: request.query.city as string,
      state: request.query.state as string,
      isDefault: request.query.isDefault ? request.query.isDefault === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }
    
    const result = await listCustomerAddressesUseCase.execute(filters)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_CUSTOMER_ADDRESSES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: CustomerAddressViewModel.fromCustomerAddressList(result.data)
    }
    
    response.status(200).json(viewModelResult)
  }
}