import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => () => {},
  container: { resolve: jest.fn() }
}))

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}))

jest.mock('@shared/http/middlewares/auth.middleware', () => ({
  generateTokens: jest.fn()
}))

import RefreshTokenUseCase from '../../../auth/useCases/refreshToken/RefreshTokenUseCase'
import jwt from 'jsonwebtoken'
import { generateTokens } from '@shared/http/middlewares/auth.middleware'

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let mockUsersRepository: any

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
    mockUsersRepository = {
      findById: jest.fn()
    }
    refreshTokenUseCase = new RefreshTokenUseCase(mockUsersRepository)
  })

  it('should refresh token successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: { name: 'Admin' },
      canLogin: () => true
    }

    ;(jwt.verify as any).mockReturnValue({
      sub: 'user-1',
      email: 'test@example.com',
      roles: ['Admin']
    })
    ;(mockUsersRepository.findById as any).mockResolvedValue({
      success: true,
      data: mockUser
    })
    ;(generateTokens as any).mockReturnValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: '1h'
    })

    const result = await refreshTokenUseCase.execute({
      refreshToken: 'valid-refresh-token'
    })

    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toBe('new-refresh-token')
  })

  it('should throw error for invalid refresh token', async () => {
    ;(jwt.verify as any).mockImplementation(() => {
      throw new Error('invalid token')
    })

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'invalid-token' })
    ).rejects.toThrow('inválido ou expirado')
  })

  it('should throw error for non-existent user', async () => {
    ;(jwt.verify as any).mockReturnValue({ sub: 'non-existent-user' })
    ;(mockUsersRepository.findById as any).mockResolvedValue({
      success: false,
      data: null
    })

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'valid-token' })
    ).rejects.toThrow('não encontrado')
  })
})
