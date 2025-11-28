import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCompanyUseCase from './UpdateCompanyUseCase'
import UpdateCompanyViewModel from '../../viewModels/UpdateCompanyViewModel'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

export default class UpdateCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const updateCompanyUseCase = container.resolve(UpdateCompanyUseCase)
    const { id } = request.params
    const viewModel = request.body as UpdateCompanyViewModel

    console.log('UpdateCompanyController.handle:', { id, ...viewModel })
    
    const result = await updateCompanyUseCase.execute({ id, viewModel })

    if (!result.success) {
      console.error('UpdateCompanyController.handle:', { message: result.message })
      
      const statusCode = result.message.includes('não encontrada') ? 404 : 400
      
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('UpdateCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
