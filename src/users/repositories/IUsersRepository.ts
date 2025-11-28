import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import User from '../entities/User'

// Interface para filtros de busca de users
export interface UserFilters {
  name?: string
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  roleId?: string
  isActive?: boolean
  isVerified?: boolean
  hasAvatar?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'lastLoginAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de users
export default interface IUsersRepository {
  // Operations básicas
  create(user: User): Promise<IResult<User>>
  findById(id: string): Promise<IResult<User>>
  findByEmail(email: string): Promise<IResult<User>>
  findByEmailVerificationToken(token: string): Promise<IResult<User>>
  findByPasswordResetToken(token: string): Promise<IResult<User>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: UserFilters): Promise<IPaginationResult<User>>
  
  // Operations de atualização
  update(id: string, user: Partial<User>): Promise<IResult<User>>
  updateLoginInfo(id: string, lastLoginAt: Date): Promise<IResult<User>>
  incrementFailedAttempts(id: string): Promise<IResult<User>>
  lockAccount(id: string, lockedUntil: Date): Promise<IResult<User>>
  unlockAccount(id: string): Promise<IResult<User>>
  updatePassword(id: string, passwordHash: string): Promise<IResult<User>>
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<IResult<User>>
  setEmailVerificationToken(id: string, token: string): Promise<IResult<User>>
  verifyEmail(id: string): Promise<IResult<User>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<User[]>>
  findAllVerified(): Promise<IResult<User[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<User>>
  findByRole(roleId: string): Promise<IResult<User[]>>
  
  // Operations de verificação
  existsByEmail(email: string): Promise<boolean>
  existsByEmailVerificationToken(token: string): Promise<boolean>
  existsByPasswordResetToken(token: string): Promise<boolean>
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>
  
  // Operations específicas de segurança
  getLockedUsers(): Promise<IResult<User[]>>
  getUsersWithFailedAttempts(): Promise<IResult<User[]>>
  getUnverifiedUsers(olderThanDays: number): Promise<IResult<User[]>>
  
  // Operations para limpar tokens expirados
  cleanExpiredPasswordResetTokens(): Promise<number>
  cleanExpiredEmailVerificationTokens(): Promise<number>
  
  // Operation para contar total
  count(): Promise<number>
  countActive(): Promise<number>
  countVerified(): Promise<number>
  countByRole(roleId: string): Promise<number>
  
  // Operations de busca por nome/email (para autocomplete)
  searchUsers(query: string, limit?: number): Promise<IResult<User[]>>
}