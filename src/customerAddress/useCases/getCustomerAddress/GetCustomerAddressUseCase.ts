import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CustomerAddress from '../../entities/CustomerAddress'
import CustomerAddressesRepository from '../../repositories/CustomerAddressesRepository'

export default class GetCustomerAddressUseCase implements IUseCase {
  private customerAddressesRepository: CustomerAddressesRepository

  constructor() {
    this.customerAddressesRepository = new CustomerAddressesRepository()
  }

  async execute(id: string): Promise<IResult<CustomerAddress>> {
    try {
      const result = await this.customerAddressesRepository.findById(id)
      return result
    } catch (error) {
      console.error('GetCustomerAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereço do cliente',
        data: null
      }
    }
  }
}
