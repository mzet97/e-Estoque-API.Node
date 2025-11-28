import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import UsersRepository from '../../repositories/UsersRepository'

export default class DeleteUserUseCase implements IUseCase {
  private usersRepository: UsersRepository

  constructor() {
    this.usersRepository = new UsersRepository()
  }

  async execute(id: string): Promise<IResult<void>> {
    try {
      console.log('DeleteUserUseCase.execute:', { id })

      // Verificar se usuário existe
      const existingUser = await this.usersRepository.findById(id)
      if (!existingUser.success) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      // Verificar se pode ser deletado (regras de negócio)
      // Por exemplo, não permitir deletar o próprio usuário ou administradores
      const user = existingUser.data
      if (user.isAdmin()) {
        return {
          success: false,
          message: 'Não é possível deletar usuários administradores',
          data: null
        }
      }

      // Soft delete
      const result = await this.usersRepository.delete(id)

      if (result.success) {
        console.log('DeleteUserUseCase.execute:', { id, message: result.message })
      }

      return result
    } catch (error) {
      console.error('DeleteUserUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar usuário',
        data: null
      }
    }
  }
}