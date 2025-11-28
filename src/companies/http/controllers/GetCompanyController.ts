import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCompanyUseCase from './GetCompanyUseCase'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

export default class GetCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const getCompanyUseCase = container.resolve(GetCompanyUseCase)
    const { id } = request.params

    console.log('GetCompanyController.handle:', { id })
    
    const result = await getCompanyUseCase.execute(id)

    if (!result.success) {
      console.error('GetCompanyController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'COMPANY_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('GetCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
