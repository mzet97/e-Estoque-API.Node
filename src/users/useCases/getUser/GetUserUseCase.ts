import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import UsersRepository from '../../repositories/UsersRepository'
import User from '../entities/User'

export default class GetUserUseCase implements IUseCase {
  private usersRepository: UsersRepository

  constructor() {
    this.usersRepository = new UsersRepository()
  }

  async execute(id: string, includeRole: boolean = true): Promise<IResult<User>> {
    try {
      console.log('GetUserUseCase.execute:', { id, includeRole })

      const result = await this.usersRepository.findById(id)

      if (!result.success) {
        console.error('GetUserUseCase.execute:', { message: result.message })
        return result
      }

      console.log('GetUserUseCase.execute:', { 
        id: result.data.id, 
        name: result.data.name,
        message: result.message 
      })

      return result
    } catch (error) {
      console.error('GetUserUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuário',
        data: null
      }
    }
  }
}