import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CustomerAddress from '../entities/CustomerAddress'
import CustomerAddressesRepository from '../repositories/CustomerAddressesRepository'
import CustomerAddressViewModel, { CreateCustomerAddressViewModel } from '../viewModels/CustomerAddressViewModel'

export default class CreateCustomerAddressUseCase implements IUseCase {
  private customerAddressesRepository: CustomerAddressesRepository

  constructor() {
    this.customerAddressesRepository = new CustomerAddressesRepository()
  }

  async execute(viewModel: CreateCustomerAddressViewModel): Promise<IResult<CustomerAddress>> {
    try {
      const validation = CustomerAddressViewModel.validateCreateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      const address = new CustomerAddress()
      address.type = viewModel.type
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
      address.isDefault = viewModel.isDefault || false
      address.customerId = viewModel.customerId

      const result = await this.customerAddressesRepository.create(address)
      return result
    } catch (error) {
      console.error('CreateCustomerAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao criar endereço do cliente',
        data: null
      }
    }
  }
}