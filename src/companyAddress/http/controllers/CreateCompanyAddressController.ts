import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCompanyAddressUseCase from '../../useCases/createCompanyAddress/CreateCompanyAddressUseCase'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

export default class CreateCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCompanyAddressUseCase = container.resolve(CreateCompanyAddressUseCase)
    const viewModel = request.body as CompanyAddressViewModel

    console.log('CreateCompanyAddressController.handle:', { 
      type: viewModel.type,
      companyId: viewModel.companyId,
      city: viewModel.city
    })
    
    const result = await createCompanyAddressUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCompanyAddressController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_COMPANY_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CompanyAddressViewModel.fromCompanyAddress(result.data)

    console.log('CreateCompanyAddressController.handle:', { 
      id: viewModelResult.id, 
      type: viewModelResult.type,
      message: result.message 
    })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}