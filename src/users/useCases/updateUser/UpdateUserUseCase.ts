import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import UsersRepository from '../../repositories/UsersRepository'
import User from '../entities/User'
import UserViewModel, { UpdateUserViewModel } from '../viewModels/UserViewModel'

export default class UpdateUserUseCase implements IUseCase {
  private usersRepository: UsersRepository

  constructor() {
    this.usersRepository = new UsersRepository()
  }

  async execute(id: string, viewModel: UpdateUserViewModel): Promise<IResult<User>> {
    try {
      console.log('UpdateUserUseCase.execute:', { id, viewModel })

      // Validar dados de entrada
      const validation = UserViewModel.validateUpdateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      // Verificar se usuário existe
      const existingUser = await this.usersRepository.findById(id)
      if (!existingUser.success) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      // Se estiver atualizando email, verificar se não está em uso
      if (viewModel.email && viewModel.email !== existingUser.data.email) {
        const emailExists = await this.usersRepository.isEmailTaken(viewModel.email, id)
        if (emailExists) {
          return {
            success: false,
            message: 'Email já está em uso',
            data: null
          }
        }
      }

      // Atualizar usuário
      const result = await this.usersRepository.update(id, viewModel)

      if (result.success) {
        console.log('UpdateUserUseCase.execute:', { 
          id: result.data.id, 
          message: result.message 
        })
      }

      return result
    } catch (error) {
      console.error('UpdateUserUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar usuário',
        data: null
      }
    }
  }
}