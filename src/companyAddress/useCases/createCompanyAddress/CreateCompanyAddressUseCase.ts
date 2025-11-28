import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CompanyAddress from '../entities/CompanyAddress'
import CompanyAddressesRepository from '../repositories/CompanyAddressesRepository'
import CompanyAddressViewModel, { CreateCompanyAddressViewModel } from '../viewModels/CompanyAddressViewModel'

export default class CreateCompanyAddressUseCase implements IUseCase {
  private companyAddressesRepository: CompanyAddressesRepository

  constructor() {
    this.companyAddressesRepository = new CompanyAddressesRepository()
  }

  async execute(viewModel: CreateCompanyAddressViewModel): Promise<IResult<CompanyAddress>> {
    try {
      console.log('CreateCompanyAddressUseCase.execute:', { 
        type: viewModel.type,
        companyId: viewModel.companyId,
        city: viewModel.city,
        state: viewModel.state
      })

      // Validar dados de entrada
      const validation = CompanyAddressViewModel.validateCreateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      // Criar endereço da empresa
      const address = new CompanyAddress()
      address.type = viewModel.type
      address.department = viewModel.department
      address.contactPerson = viewModel.contactPerson
      address.phone = viewModel.phone
      address.email = viewModel.email
      address.street = viewModel.street
      address.number = viewModel.number
      address.complement = viewModel.complement
      address.neighborhood = viewModel.neighborhood
      address.district = viewModel.district
      address.city = viewModel.city
      address.state = viewModel.state.toUpperCase()
      address.country = viewModel.country || 'Brasil'
      address.zipCode = viewModel.zipCode
      address.latitude = viewModel.latitude
      address.longitude = viewModel.longitude
      address.isHeadquarters = viewModel.isHeadquarters || false
      address.isActive = viewModel.isActive !== false
      address.companyId = viewModel.companyId

      // Salvar endereço
      const result = await this.companyAddressesRepository.create(address)

      if (result.success) {
        console.log('CreateCompanyAddressUseCase.execute:', { 
          id: result.data.id, 
          type: result.data.type,
          message: result.message 
        })
      }

      return result
    } catch (error) {
      console.error('CreateCompanyAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao criar endereço da empresa',
        data: null
      }
    }
  }
}