import { container } from 'tsyringe'
import LoginUseCase from '../useCases/login/LoginUseCase'
import RefreshTokenUseCase from '../useCases/refreshToken/RefreshTokenUseCase'

// Register use cases
container.register('LoginUseCase', LoginUseCase)
container.register('RefreshTokenUseCase', RefreshTokenUseCase)

export { container }
