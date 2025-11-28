import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUseCase from '@shared/useCases/IUseCase'
import UsersRepository from '../../repositories/UsersRepository'
import { UserFilters } from '../../repositories/IUsersRepository'

export default class ListUsersUseCase implements IUseCase {
  private usersRepository: UsersRepository

  constructor() {
    this.usersRepository = new UsersRepository()
  }

  async execute(filters: UserFilters): Promise<IPaginationResult<any>> {
    try {
      console.log('ListUsersUseCase.execute:', { filters })

      const result = await this.usersRepository.findWithFilters(filters)

      if (!result.success) {
        console.error('ListUsersUseCase.execute:', { message: result.message })
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

      console.log('ListUsersUseCase.execute:', { 
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
      console.error('ListUsersUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao listar usuários',
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