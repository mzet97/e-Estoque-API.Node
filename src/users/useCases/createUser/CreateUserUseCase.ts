import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import User from '../entities/User'
import UsersRepository from '../repositories/UsersRepository'
import UserViewModel, { CreateUserViewModel } from '../viewModels/UserViewModel'
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt'

export default class CreateUserUseCase implements IUseCase {
  private usersRepository: UsersRepository

  constructor() {
    this.usersRepository = new UsersRepository()
  }

  async execute(viewModel: CreateUserViewModel): Promise<IResult<User>> {
    try {
      console.log('CreateUserUseCase.execute:', { 
        name: viewModel.name, 
        email: viewModel.email,
        firstName: viewModel.firstName,
        roleId: viewModel.roleId
      })

      // Validar dados de entrada
      const validation = UserViewModel.validateCreateData(viewModel)
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          data: null
        }
      }

      // Verificar se email já existe
      const emailExists = await this.usersRepository.existsByEmail(viewModel.email)
      if (emailExists) {
        return {
          success: false,
          message: 'Email já está em uso',
          data: null
        }
      }

      // Hash da senha (para este exemplo, usamos uma senha padrão)
      // Em produção, a senha deve vir do request
      const passwordHash = await bcrypt.hash('TempPassword123!', 10)

      // Verificar se a role existe
      // Aqui seria necessário verificar se a role existe através do repository de roles
      // Por simplicidade, assumimos que a role existe

      // Criar usuário
      const user = User.create(
        viewModel.name,
        viewModel.email,
        passwordHash,
        viewModel.firstName,
        viewModel.lastName || '',
        viewModel.roleId,
        viewModel.phoneNumber,
        viewModel.avatarUrl
      )

      // Gerar token de verificação de email
      const verificationToken = uuidv4()
      user.setEmailVerificationToken(verificationToken)

      // Salvar usuário
      const result = await this.usersRepository.create(user)

      if (result.success) {
        console.log('CreateUserUseCase.execute:', { 
          id: result.data.id, 
          message: result.message 
        })
      }

      return result
    } catch (error) {
      console.error('CreateUserUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao criar usuário',
        data: null
      }
    }
  }
}