import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock tsyringe
jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => () => {},
  container: { resolve: jest.fn() }
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

// Mock the auth middleware
jest.mock('@shared/http/middlewares/auth.middleware', () => ({
  generateTokens: jest.fn()
}))

import LoginUseCase from '../../../auth/useCases/login/LoginUseCase'
import bcrypt from 'bcryptjs'
import { generateTokens } from '@shared/http/middlewares/auth.middleware'

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let mockUsersRepository: any

  beforeEach(() => {
    mockUsersRepository = {
      findByEmail: jest.fn(),
      update: jest.fn(),
      updateLoginInfo: jest.fn()
    }
    loginUseCase = new LoginUseCase(mockUsersRepository)
  })

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2a$10$hashedpassword',
      roleId: 'role-1',
      role: { id: 'role-1', name: 'Admin' },
      canLogin: () => true,
      isLocked: () => false,
      registerSuccessfulLogin: jest.fn(),
      registerFailedLogin: jest.fn(),
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null
    }

    ;(mockUsersRepository.findByEmail as any).mockResolvedValue({
      success: true,
      data: mockUser
    })
    ;(bcrypt.compare as any).mockResolvedValue(true)
    ;(generateTokens as any).mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '1h'
    })

    const result = await loginUseCase.execute({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')
    expect(result.user.email).toBe('test@example.com')
  })

  it('should throw error for non-existent user', async () => {
    ;(mockUsersRepository.findByEmail as any).mockResolvedValue({
      success: false,
      data: null
    })

    await expect(
      loginUseCase.execute({ email: 'nonexistent@example.com', password: 'password123' })
    ).rejects.toThrow('Email ou senha inválidos')
  })

  it('should throw error for wrong password', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      canLogin: () => true,
      isLocked: () => false,
      registerFailedLogin: jest.fn(),
      failedLoginAttempts: 0,
      lockedUntil: null
    }

    ;(mockUsersRepository.findByEmail as any).mockResolvedValue({
      success: true,
      data: mockUser
    })
    ;(bcrypt.compare as any).mockResolvedValue(false)

    await expect(
      loginUseCase.execute({ email: 'test@example.com', password: 'wrongpassword' })
    ).rejects.toThrow('Email ou senha inválidos')
  })

  it('should throw error for locked account', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      canLogin: () => false,
      isLocked: () => true
    }

    ;(mockUsersRepository.findByEmail as any).mockResolvedValue({
      success: true,
      data: mockUser
    })

    await expect(
      loginUseCase.execute({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('bloqueada')
  })
})
