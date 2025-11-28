import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ICompaniesRepository, { CompanyFilters } from '../../repositories/ICompaniesRepository'

@injectable()
export default class ListCompaniesUseCase implements IUseCase<CompanyFilters, IPaginationResult<any>> {
  constructor(
    @Inject('CompaniesRepository')
    private companiesRepository: ICompaniesRepository,
  ) {}

  async execute(filters: CompanyFilters): Promise<IPaginationResult<any>> {
    try {
      const result = await this.companiesRepository.findWithFilters(filters)

      return result
    } catch (error) {
      console.error('Error in ListCompaniesUseCase:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: filters.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Erro interno ao listar empresas'
      }
    }
  }
}
