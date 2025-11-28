import { Repository, Like, LessThan, Not, In } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { AppDataSource } from '@shared/typeorm'
import IUsersRepository, { UserFilters } from './IUsersRepository'
import User from '../entities/User'
import { v4 as uuidv4 } from 'uuid'

export default class UsersRepository implements IUsersRepository {
  private repository: Repository<User>

  constructor() {
    this.repository = AppDataSource.getRepository(User)
  }

  async create(user: User): Promise<IResult<User>> {
    try {
      // Verificar se email já existe
      const emailExists = await this.existsByEmail(user.email)
      if (emailExists) {
        return {
          success: false,
          message: 'Email já está em uso',
          data: null
        }
      }

      const savedUser = await this.repository.save(user)
      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: savedUser
      }
    } catch (error) {
      console.error('UsersRepository.create:', error)
      return {
        success: false,
        message: 'Erro interno ao criar usuário',
        data: null
      }
    }
  }

  async findById(id: string): Promise<IResult<User>> {
    try {
      const user = await this.repository.findOne({
        where: { id },
        relations: ['role']
      })

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Usuário encontrado',
        data: user
      }
    } catch (error) {
      console.error('UsersRepository.findById:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuário',
        data: null
      }
    }
  }

  async findByEmail(email: string): Promise<IResult<User>> {
    try {
      const user = await this.repository.findOne({
        where: { email: email.toLowerCase().trim() },
        relations: ['role']
      })

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Usuário encontrado',
        data: user
      }
    } catch (error) {
      console.error('UsersRepository.findByEmail:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuário',
        data: null
      }
    }
  }

  async findByEmailVerificationToken(token: string): Promise<IResult<User>> {
    try {
      const user = await this.repository.findOne({
        where: { emailVerificationToken: token },
        relations: ['role']
      })

      if (!user) {
        return {
          success: false,
          message: 'Token de verificação inválido',
          data: null
        }
      }

      return {
        success: true,
        message: 'Token encontrado',
        data: user
      }
    } catch (error) {
      console.error('UsersRepository.findByEmailVerificationToken:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar token',
        data: null
      }
    }
  }

  async findByPasswordResetToken(token: string): Promise<IResult<User>> {
    try {
      const user = await this.repository.findOne({
        where: { 
          passwordResetToken: token,
          passwordResetExpires: LessThan(new Date())
        },
        relations: ['role']
      })

      if (!user) {
        return {
          success: false,
          message: 'Token de reset inválido ou expirado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Token válido',
        data: user
      }
    } catch (error) {
      console.error('UsersRepository.findByPasswordResetToken:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar token',
        data: null
      }
    }
  }

  async findWithFilters(filters: UserFilters): Promise<IPaginationResult<User>> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')

      // Aplicar filtros
      if (filters.name) {
        queryBuilder.andWhere('user.name ILIKE :name', { name: `%${filters.name}%` })
      }

      if (filters.email) {
        queryBuilder.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` })
      }

      if (filters.firstName) {
        queryBuilder.andWhere('user.firstName ILIKE :firstName', { firstName: `%${filters.firstName}%` })
      }

      if (filters.lastName) {
        queryBuilder.andWhere('user.lastName ILIKE :lastName', { lastName: `%${filters.lastName}%` })
      }

      if (filters.phoneNumber) {
        queryBuilder.andWhere('user.phoneNumber ILIKE :phoneNumber', { phoneNumber: `%${filters.phoneNumber}%` })
      }

      if (filters.roleId) {
        queryBuilder.andWhere('user.roleId = :roleId', { roleId: filters.roleId })
      }

      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive })
      }

      if (filters.isVerified !== undefined) {
        queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified: filters.isVerified })
      }

      if (filters.hasAvatar !== undefined) {
        if (filters.hasAvatar) {
          queryBuilder.andWhere('user.avatarUrl IS NOT NULL')
        } else {
          queryBuilder.andWhere('user.avatarUrl IS NULL')
        }
      }

      // Excluir usuários deletados
      queryBuilder.andWhere('user.isDeleted = false')

      // Ordenação
      const orderBy = filters.orderBy || 'createdAt'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`user.${orderBy}`, orderDirection)

      // Paginação
      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      queryBuilder.skip(skip).take(pageSize)

      const [users, totalItems] = await queryBuilder.getManyAndCount()

      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        message: 'Usuários encontrados',
        data: users,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    } catch (error) {
      console.error('UsersRepository.findWithFilters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários',
        data: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      }
    }
  }

  async update(id: string, userData: Partial<User>): Promise<IResult<User>> {
    try {
      const existingUser = await this.repository.findOne({ where: { id } })
      if (!existingUser) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      // Se estiver atualizando email, verificar se não está em uso por outro usuário
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.existsByEmail(userData.email)
        if (emailExists) {
          return {
            success: false,
            message: 'Email já está em uso',
            data: null
          }
        }
      }

      Object.assign(existingUser, userData)
      existingUser.updatedAt = new Date()

      const updatedUser = await this.repository.save(existingUser)
      
      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser
      }
    } catch (error) {
      console.error('UsersRepository.update:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar usuário',
        data: null
      }
    }
  }

  async updateLoginInfo(id: string, lastLoginAt: Date): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        lastLoginAt, 
        failedLoginAttempts: 0, 
        lockedUntil: null 
      })
      return result
    } catch (error) {
      console.error('UsersRepository.updateLoginInfo:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar info de login',
        data: null
      }
    }
  }

  async incrementFailedAttempts(id: string): Promise<IResult<User>> {
    try {
      const user = await this.repository.findOne({ where: { id } })
      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      user.failedLoginAttempts += 1
      
      // Bloquear conta após 5 tentativas falhas
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      }

      const updatedUser = await this.repository.save(user)

      return {
        success: true,
        message: 'Tentativas falhas atualizadas',
        data: updatedUser
      }
    } catch (error) {
      console.error('UsersRepository.incrementFailedAttempts:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar tentativas falhas',
        data: null
      }
    }
  }

  async lockAccount(id: string, lockedUntil: Date): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { lockedUntil })
      return result
    } catch (error) {
      console.error('UsersRepository.lockAccount:', error)
      return {
        success: false,
        message: 'Erro interno ao bloquear conta',
        data: null
      }
    }
  }

  async unlockAccount(id: string): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        failedLoginAttempts: 0, 
        lockedUntil: null 
      })
      return result
    } catch (error) {
      console.error('UsersRepository.unlockAccount:', error)
      return {
        success: false,
        message: 'Erro interno ao desbloquear conta',
        data: null
      }
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordResetToken: null,
        passwordResetExpires: null
      })
      return result
    } catch (error) {
      console.error('UsersRepository.updatePassword:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar senha',
        data: null
      }
    }
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        passwordResetToken: token,
        passwordResetExpires: expires
      })
      return result
    } catch (error) {
      console.error('UsersRepository.setPasswordResetToken:', error)
      return {
        success: false,
        message: 'Erro interno ao definir token de reset',
        data: null
      }
    }
  }

  async setEmailVerificationToken(id: string, token: string): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        emailVerificationToken: token
      })
      return result
    } catch (error) {
      console.error('UsersRepository.setEmailVerificationToken:', error)
      return {
        success: false,
        message: 'Erro interno ao definir token de verificação',
        data: null
      }
    }
  }

  async verifyEmail(id: string): Promise<IResult<User>> {
    try {
      const result = await this.update(id, { 
        isVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null
      })
      return result
    } catch (error) {
      console.error('UsersRepository.verifyEmail:', error)
      return {
        success: false,
        message: 'Erro interno ao verificar email',
        data: null
      }
    }
  }

  async delete(id: string): Promise<IResult<void>> {
    try {
      const user = await this.repository.findOne({ where: { id } })
      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      user.isDeleted = true
      user.deletedAt = new Date()
      await this.repository.save(user)

      return {
        success: true,
        message: 'Usuário deletado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('UsersRepository.delete:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar usuário',
        data: null
      }
    }
  }

  async restore(id: string): Promise<IResult<void>> {
    try {
      const user = await this.repository.findOne({ 
        where: { id },
        withDeleted: true 
      })

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
          data: null
        }
      }

      user.isDeleted = false
      user.deletedAt = null
      await this.repository.save(user)

      return {
        success: true,
        message: 'Usuário restaurado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('UsersRepository.restore:', error)
      return {
        success: false,
        message: 'Erro interno ao restaurar usuário',
        data: null
      }
    }
  }

  async findAllActive(): Promise<IResult<User[]>> {
    try {
      const users = await this.repository.find({
        where: { isActive: true, isDeleted: false },
        relations: ['role'],
        order: { name: 'ASC' }
      })

      return {
        success: true,
        message: 'Usuários ativos encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.findAllActive:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários ativos',
        data: []
      }
    }
  }

  async findAllVerified(): Promise<IResult<User[]>> {
    try {
      const users = await this.repository.find({
        where: { isVerified: true, isDeleted: false },
        relations: ['role'],
        order: { name: 'ASC' }
      })

      return {
        success: true,
        message: 'Usuários verificados encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.findAllVerified:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários verificados',
        data: []
      }
    }
  }

  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<User>> {
    return this.findWithFilters({ page, pageSize })
  }

  async findByRole(roleId: string): Promise<IResult<User[]>> {
    try {
      const users = await this.repository.find({
        where: { roleId, isDeleted: false },
        relations: ['role'],
        order: { name: 'ASC' }
      })

      return {
        success: true,
        message: 'Usuários da role encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.findByRole:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários da role',
        data: []
      }
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { 
          email: email.toLowerCase().trim(),
          isDeleted: false
        }
      })
      return count > 0
    } catch (error) {
      console.error('UsersRepository.existsByEmail:', error)
      return false
    }
  }

  async existsByEmailVerificationToken(token: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { emailVerificationToken: token }
      })
      return count > 0
    } catch (error) {
      console.error('UsersRepository.existsByEmailVerificationToken:', error)
      return false
    }
  }

  async existsByPasswordResetToken(token: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { 
          passwordResetToken: token,
          passwordResetExpires: LessThan(new Date())
        }
      })
      return count > 0
    } catch (error) {
      console.error('UsersRepository.existsByPasswordResetToken:', error)
      return false
    }
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const whereClause: any = { 
        email: email.toLowerCase().trim(),
        isDeleted: false
      }
      
      if (excludeUserId) {
        whereClause.id = Not(excludeUserId)
      }

      const count = await this.repository.count({ where: whereClause })
      return count > 0
    } catch (error) {
      console.error('UsersRepository.isEmailTaken:', error)
      return false
    }
  }

  async getLockedUsers(): Promise<IResult<User[]>> {
    try {
      const users = await this.repository.find({
        where: { 
          lockedUntil: LessThan(new Date()),
          isDeleted: false
        },
        relations: ['role']
      })

      return {
        success: true,
        message: 'Usuários bloqueados encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.getLockedUsers:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários bloqueados',
        data: []
      }
    }
  }

  async getUsersWithFailedAttempts(): Promise<IResult<User[]>> {
    try {
      const users = await this.repository.find({
        where: { 
          failedLoginAttempts: 1,
          isDeleted: false
        },
        relations: ['role']
      })

      return {
        success: true,
        message: 'Usuários com tentativas falhas encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.getUsersWithFailedAttempts:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários com tentativas falhas',
        data: []
      }
    }
  }

  async getUnverifiedUsers(olderThanDays: number): Promise<IResult<User[]>> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const users = await this.repository.find({
        where: { 
          isVerified: false,
          isDeleted: false,
          createdAt: LessThan(cutoffDate)
        },
        relations: ['role']
      })

      return {
        success: true,
        message: 'Usuários não verificados encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.getUnverifiedUsers:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários não verificados',
        data: []
      }
    }
  }

  async cleanExpiredPasswordResetTokens(): Promise<number> {
    try {
      const result = await this.repository.update(
        {
          passwordResetExpires: LessThan(new Date())
        },
        {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      )
      return result.affected || 0
    } catch (error) {
      console.error('UsersRepository.cleanExpiredPasswordResetTokens:', error)
      return 0
    }
  }

  async cleanExpiredEmailVerificationTokens(): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7) // 7 dias

      const result = await this.repository.update(
        {
          emailVerificationToken: Not(null),
          createdAt: LessThan(cutoffDate),
          isVerified: false
        },
        {
          emailVerificationToken: null
        }
      )
      return result.affected || 0
    } catch (error) {
      console.error('UsersRepository.cleanExpiredEmailVerificationTokens:', error)
      return 0
    }
  }

  async count(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('UsersRepository.count:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isActive: true, isDeleted: false }
      })
    } catch (error) {
      console.error('UsersRepository.countActive:', error)
      return 0
    }
  }

  async countVerified(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isVerified: true, isDeleted: false }
      })
    } catch (error) {
      console.error('UsersRepository.countVerified:', error)
      return 0
    }
  }

  async countByRole(roleId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { roleId, isDeleted: false }
      })
    } catch (error) {
      console.error('UsersRepository.countByRole:', error)
      return 0
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<IResult<User[]>> {
    try {
      const users = await this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.name ILIKE :query OR user.email ILIKE :query OR user.firstName ILIKE :query', { 
          query: `%${query}%` 
        })
        .andWhere('user.isDeleted = false')
        .orderBy('user.name', 'ASC')
        .limit(limit)
        .getMany()

      return {
        success: true,
        message: 'Usuários encontrados',
        data: users
      }
    } catch (error) {
      console.error('UsersRepository.searchUsers:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar usuários',
        data: []
      }
    }
  }
}