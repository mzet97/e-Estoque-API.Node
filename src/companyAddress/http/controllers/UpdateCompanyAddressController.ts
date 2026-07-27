import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCompanyAddressUseCase from '../../useCases/updateCompanyAddress/UpdateCompanyAddressUseCase'
import CompanyAddressViewModel, { UpdateCompanyAddressViewModel } from '../../viewModels/CompanyAddressViewModel'

export default class UpdateCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const updateCompanyAddressUseCase = container.resolve(UpdateCompanyAddressUseCase)
    const { id } = request.params
    const viewModel = request.body as UpdateCompanyAddressViewModel

    const result = await updateCompanyAddressUseCase.execute(id, viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: [{ code: 'UPDATE_COMPANY_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CompanyAddressViewModel.fromCompanyAddress(result.data)

    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
