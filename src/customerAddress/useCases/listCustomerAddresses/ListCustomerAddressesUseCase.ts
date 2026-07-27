import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUseCase from '@shared/useCases/IUseCase'
import CustomerAddress from '../../entities/CustomerAddress'
import CustomerAddressesRepository from '../../repositories/CustomerAddressesRepository'
import { ListCustomerAddressesViewModel } from '../../viewModels/CustomerAddressViewModel'

export default class ListCustomerAddressesUseCase implements IUseCase {
  private customerAddressesRepository: CustomerAddressesRepository

  constructor() {
    this.customerAddressesRepository = new CustomerAddressesRepository()
  }

  async execute(filters: ListCustomerAddressesViewModel): Promise<IPaginationResult<CustomerAddress>> {
    try {
      const result = await this.customerAddressesRepository.findWithFilters(filters)
      return result
    } catch (error) {
      console.error('ListCustomerAddressesUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao listar endereços do cliente',
        data: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      }
    }
  }
}
