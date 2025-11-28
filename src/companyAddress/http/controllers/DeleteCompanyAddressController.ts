import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCompanyAddressUseCase from '../../useCases/deleteCompanyAddress/DeleteCompanyAddressUseCase'

export default class DeleteCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteCompanyAddressUseCase = container.resolve(DeleteCompanyAddressUseCase)

    console.log('DeleteCompanyAddressController.handle:', { id })
    
    const result = await deleteCompanyAddressUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteCompanyAddressController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_COMPANY_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCompanyAddressController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}