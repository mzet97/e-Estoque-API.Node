import { injectable, inject } from 'tsyringe'
import bcrypt from 'bcryptjs'
import IUsersRepository from '@users/repositories/IUsersRepository'
import { generateTokens } from '@shared/http/middlewares/auth.middleware'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: {
    id: string
    name: string
    email: string
    firstName: string
    lastName?: string
    role: {
      id: string
      name: string
    }
  }
}

@injectable()
export default class LoginUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute({ email, password }: LoginRequest): Promise<LoginResponse> {
    // Buscar usuário por email
    const userResult = await this.usersRepository.findByEmail(email)

    if (!userResult.success || !userResult.data) {
      throw new Error('Email ou senha inválidos')
    }

    const user = userResult.data

    // Verificar se o usuário pode fazer login
    if (!user.canLogin()) {
      if (user.isLocked()) {
        throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.')
      }
      throw new Error('Conta desativada. Entre em contato com o administrador.')
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      // Registrar tentativa falha
      user.registerFailedLogin()
      await this.usersRepository.update(user.id, {
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil
      })
      throw new Error('Email ou senha inválidos')
    }

    // Registrar login bem-sucedido
    user.registerSuccessfulLogin()
    await this.usersRepository.updateLoginInfo(user.id, user.lastLoginAt!)

    // Gerar tokens
    const roles = user.role ? [user.role.name] : ['User']
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      roles
    })

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.roleId,
          name: user.role?.name || 'User'
        }
      }
    }
  }
}
