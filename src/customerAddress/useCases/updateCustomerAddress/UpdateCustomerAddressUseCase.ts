import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CustomerAddress from '../../entities/CustomerAddress'
import CustomerAddressesRepository from '../../repositories/CustomerAddressesRepository'
import CustomerAddressViewModel, { UpdateCustomerAddressViewModel } from '../../viewModels/CustomerAddressViewModel'

export default class UpdateCustomerAddressUseCase implements IUseCase {
  private customerAddressesRepository: CustomerAddressesRepository

  constructor() {
    this.customerAddressesRepository = new CustomerAddressesRepository()
  }

  async execute(id: string, viewModel: UpdateCustomerAddressViewModel): Promise<IResult<CustomerAddress>> {
    try {
      const validation = CustomerAddressViewModel.validateUpdateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      const updateData: Partial<CustomerAddress> = { ...viewModel }

      if (updateData.state) {
        updateData.state = updateData.state.toUpperCase()
      }

      const result = await this.customerAddressesRepository.update(id, updateData)
      return result
    } catch (error) {
      console.error('UpdateCustomerAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar endereço do cliente',
        data: null
      }
    }
  }
}
