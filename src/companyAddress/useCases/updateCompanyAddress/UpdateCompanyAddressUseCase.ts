import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CompanyAddressesRepository from '../../repositories/CompanyAddressesRepository'
import CompanyAddress from '../entities/CompanyAddress'
import CompanyAddressViewModel, { UpdateCompanyAddressViewModel } from '../viewModels/CompanyAddressViewModel'

export default class UpdateCompanyAddressUseCase implements IUseCase {
  private companyAddressesRepository: CompanyAddressesRepository

  constructor() {
    this.companyAddressesRepository = new CompanyAddressesRepository()
  }

  async execute(id: string, viewModel: UpdateCompanyAddressViewModel): Promise<IResult<CompanyAddress>> {
    try {
      console.log('UpdateCompanyAddressUseCase.execute:', { id, viewModel })

      // Validar dados de entrada
      const validation = CompanyAddressViewModel.validateUpdateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      // Preparar dados para atualização
      const updateData: Partial<CompanyAddress> = { ...viewModel }
      
      // Converter state para maiúsculo
      if (updateData.state) {
        updateData.state = updateData.state.toUpperCase()
      }

      // Atualizar endereço
      const result = await this.companyAddressesRepository.update(id, updateData)

      if (result.success) {
        console.log('UpdateCompanyAddressUseCase.execute:', { 
          id: result.data.id, 
          message: result.message 
        })
      }

      return result
    } catch (error) {
      console.error('UpdateCompanyAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar endereço da empresa',
        data: null
      }
    }
  }
}