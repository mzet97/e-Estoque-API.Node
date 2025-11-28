import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Customer from '../entities/Customer'
import ShowCustomerViewModel from './ShowCustomerViewModel'

export default class ListCustomersViewModel {
  items: ShowCustomerViewModel[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }

  constructor(paginationResult: IPaginationResult<Customer>) {
    this.items = ShowCustomerViewModel.fromCustomers(paginationResult.data.items)
    this.pagination = paginationResult.data.pagination
  }

  static fromPaginationResult(result: IPaginationResult<Customer>): ListCustomersViewModel {
    return new ListCustomersViewModel(result)
  }

  // Método para obter apenas os resumos
  getSummaries(): object[] {
    return this.items.map(customer => customer.getSummary())
  }

  // Método para obter estatísticas da listagem
  getStatistics(): object {
    return {
      totalItems: this.pagination.totalItems,
      totalPages: this.pagination.totalPages,
      currentPage: this.pagination.currentPage,
      pageSize: this.pagination.pageSize,
      hasNextPage: this.pagination.hasNextPage,
      hasPreviousPage: this.pagination.hasPreviousPage,
      individuals: this.items.filter(item => item.isIndividual()).length,
      companies: this.items.filter(item => item.isCompany()).length,
      withAddress: this.items.filter(item => item.hasValidAddress).length,
      active: this.items.filter(item => item.isActive).length
    }
  }
}