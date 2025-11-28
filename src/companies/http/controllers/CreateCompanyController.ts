import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCompanyUseCase from './CreateCompanyUseCase'
import CreateCompanyViewModel from '../../viewModels/CreateCompanyViewModel'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

export default class CreateCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCompanyUseCase = container.resolve(CreateCompanyUseCase)
    const viewModel = request.body as CreateCompanyViewModel

    console.log('CreateCompanyController.handle:', { name: viewModel.name, email: viewModel.email })
    
    const result = await createCompanyUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCompanyController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('CreateCompanyController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
