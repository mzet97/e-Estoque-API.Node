import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import DeleteCustomerAddressUseCase from '../../useCases/deleteCustomerAddress/DeleteCustomerAddressUseCase'

export default class DeleteCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteCustomerAddressUseCase = container.resolve(DeleteCustomerAddressUseCase)

    const result = await deleteCustomerAddressUseCase.execute(id)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}