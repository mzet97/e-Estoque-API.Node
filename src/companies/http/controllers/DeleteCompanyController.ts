import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCompanyUseCase from './DeleteCompanyUseCase'

export default class DeleteCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const deleteCompanyUseCase = container.resolve(DeleteCompanyUseCase)
    const { id } = request.params

    console.log('DeleteCompanyController.handle:', { id })
    
    const result = await deleteCompanyUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteCompanyController.handle:', { message: result.message })
      
      const statusCode = result.message.includes('não encontrada') ? 404 : 400
      
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}
