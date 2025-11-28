import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import Tax from '../entities/Tax'
import TaxesRepository from '../repositories/TaxesRepository'
import TaxViewModel, { CreateTaxViewModel } from '../viewModels/TaxViewModel'

export default class CreateTaxUseCase implements IUseCase {
  private taxesRepository: TaxesRepository

  constructor() {
    this.taxesRepository = new TaxesRepository()
  }

  async execute(viewModel: CreateTaxViewModel): Promise<IResult<Tax>> {
    try {
      const validation = TaxViewModel.validateCreateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      const tax = new Tax()
      tax.name = viewModel.name
      tax.description = viewModel.description
      tax.percentage = viewModel.percentage
      tax.idCategory = viewModel.idCategory
      tax.isActive = viewModel.isActive !== false

      const result = await this.taxesRepository.create(tax)
      return result
    } catch (error) {
      console.error('CreateTaxUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao criar imposto',
        data: null
      }
    }
  }
}