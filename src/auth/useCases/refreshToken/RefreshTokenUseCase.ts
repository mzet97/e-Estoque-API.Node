import { injectable, inject } from 'tsyringe'
import jwt from 'jsonwebtoken'
import IUsersRepository from '@users/repositories/IUsersRepository'
import { generateTokens, JWTPayload } from '@shared/http/middlewares/auth.middleware'

interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

@injectable()
export default class RefreshTokenUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute({ refreshToken }: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não está configurado')
    }

    // Verificar o refresh token
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(refreshToken, jwtSecret) as JWTPayload
    } catch (error) {
      throw new Error('Refresh token inválido ou expirado')
    }

    // Buscar usuário para garantir que ainda existe e está ativo
    const userResult = await this.usersRepository.findById(decoded.sub)

    if (!userResult.success || !userResult.data) {
      throw new Error('Usuário não encontrado')
    }

    const user = userResult.data

    if (!user.canLogin()) {
      throw new Error('Conta desativada ou bloqueada')
    }

    // Gerar novos tokens
    const roles = user.role ? [user.role.name] : decoded.roles || ['User']
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      roles
    })

    return tokens
  }
}
