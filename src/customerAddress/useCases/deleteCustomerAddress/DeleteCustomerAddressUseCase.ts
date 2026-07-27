import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CustomerAddressesRepository from '../../repositories/CustomerAddressesRepository'

export default class DeleteCustomerAddressUseCase implements IUseCase {
  private customerAddressesRepository: CustomerAddressesRepository

  constructor() {
    this.customerAddressesRepository = new CustomerAddressesRepository()
  }

  async execute(id: string): Promise<IResult<void>> {
    try {
      const result = await this.customerAddressesRepository.delete(id)
      return result
    } catch (error) {
      console.error('DeleteCustomerAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar endereço do cliente',
        data: null
      }
    }
  }
}
