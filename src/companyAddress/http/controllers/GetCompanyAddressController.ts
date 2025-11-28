import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCompanyAddressUseCase from '../../useCases/getCompanyAddress/GetCompanyAddressUseCase'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

export default class GetCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCompany = request.query.includeCompany !== 'false'
    const getCompanyAddressUseCase = container.resolve(GetCompanyAddressUseCase)

    console.log('GetCompanyAddressController.handle:', { id, includeCompany })
    
    const result = await getCompanyAddressUseCase.execute(id)

    if (!result.success) {
      console.error('GetCompanyAddressController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'COMPANY_ADDRESS_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = CompanyAddressViewModel.fromCompanyAddress(result.data, includeCompany)

    console.log('GetCompanyAddressController.handle:', { 
      id: viewModelResult.id, 
      type: viewModelResult.type,
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}