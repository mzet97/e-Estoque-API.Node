import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUseCase from '@shared/useCases/IUseCase'
import CompanyAddressesRepository from '../../repositories/CompanyAddressesRepository'
import { CompanyAddressFilters } from '../../repositories/ICompanyAddressesRepository'

export default class ListCompanyAddressesUseCase implements IUseCase {
  private companyAddressesRepository: CompanyAddressesRepository

  constructor() {
    this.companyAddressesRepository = new CompanyAddressesRepository()
  }

  async execute(filters: CompanyAddressFilters): Promise<IPaginationResult<any>> {
    try {
      console.log('ListCompanyAddressesUseCase.execute:', { filters })

      const result = await this.companyAddressesRepository.findWithFilters(filters)

      if (!result.success) {
        console.error('ListCompanyAddressesUseCase.execute:', { message: result.message })
        return {
          success: false,
          message: result.message,
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

      console.log('ListCompanyAddressesUseCase.execute:', { 
        totalItems: result.pagination.totalItems,
        message: result.message 
      })

      return {
        success: true,
        message: result.message,
        data: result.data,
        pagination: result.pagination
      }
    } catch (error) {
      console.error('ListCompanyAddressesUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao listar endereços da empresa',
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