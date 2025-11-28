import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ICustomersRepository, { CustomerFilters } from '../../repositories/ICustomersRepository'
import ListCustomersViewModel from '../../viewModels/ListCustomersViewModel'

@injectable()
export default class ListCustomersUseCase implements IUseCase<ListCustomersViewModel, IPaginationResult<any>> {
  constructor(
    @Inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(viewModel: ListCustomersViewModel): Promise<IPaginationResult<any>> {
    try {
      // Converter ViewModel para filtros
      const filters: CustomerFilters = {
        name: viewModel.name,
        email: viewModel.email,
        docId: viewModel.docId,
        phoneNumber: viewModel.phoneNumber,
        personType: viewModel.personType,
        hasAddress: viewModel.hasAddress,
        isActive: viewModel.isActive,
        search: viewModel.search,
        page: viewModel.page || 1,
        pageSize: viewModel.pageSize || 20,
        orderBy: viewModel.orderBy || 'createdAt',
        orderDirection: viewModel.orderDirection || 'DESC'
      }

      const result = await this.customersRepository.findWithFilters(filters)

      return result
    } catch (error) {
      console.error('Error in ListCustomersUseCase:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: viewModel.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Erro interno ao listar clientes'
      }
    }
  }
}