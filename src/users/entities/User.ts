import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { Role } from '../../roles/entities/Role'

@Entity('users')
export class User extends BaseEntity {

  @Column({
    length: 255,
  })
  name: string

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
  })
  passwordHash: string

  @Column({
    name: 'first_name',
    length: 100,
  })
  firstName: string

  @Column({
    name: 'last_name',
    length: 100,
    nullable: true,
  })
  lastName?: string

  @Column({
    name: 'phone_number',
    length: 20,
    nullable: true,
  })
  phoneNumber?: string

  @Column({
    name: 'avatar_url',
    length: 500,
    nullable: true,
  })
  avatarUrl?: string

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean

  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified: boolean

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
  })
  lastLoginAt?: Date

  @Column({
    name: 'failed_login_attempts',
    type: 'integer',
    default: 0,
  })
  failedLoginAttempts: number

  @Column({
    name: 'locked_until',
    type: 'timestamp',
    nullable: true,
  })
  lockedUntil?: Date

  @Column({
    name: 'password_reset_token',
    length: 255,
    nullable: true,
  })
  passwordResetToken?: string

  @Column({
    name: 'password_reset_expires',
    type: 'timestamp',
    nullable: true,
  })
  passwordResetExpires?: Date

  @Column({
    name: 'email_verification_token',
    length: 255,
    nullable: true,
  })
  emailVerificationToken?: string

  @Column({
    name: 'email_verified_at',
    type: 'timestamp',
    nullable: true,
  })
  emailVerifiedAt?: Date

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'role_id' })
  role: Role

  @Column({
    name: 'role_id',
    type: 'uuid',
    nullable: false,
  })
  roleId: string

  constructor() {
    super()
  }

  // Factory method para criar um novo User
  static create(
    name: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    roleId: string,
    phoneNumber?: string,
    avatarUrl?: string
  ): User {
    const user = new User()
    user.name = name
    user.email = email.toLowerCase().trim()
    user.passwordHash = passwordHash
    user.firstName = firstName
    user.lastName = lastName
    user.roleId = roleId
    user.phoneNumber = phoneNumber
    user.avatarUrl = avatarUrl
    user.isActive = true
    user.isVerified = false
    user.failedLoginAttempts = 0
    user.createdAt = new Date()
    return user
  }

  // Método para atualizar os dados do usuário
  update(
    name?: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    avatarUrl?: string,
    roleId?: string
  ): void {
    if (name) this.name = name
    if (firstName) this.firstName = firstName
    if (lastName !== undefined) this.lastName = lastName
    if (phoneNumber !== undefined) this.phoneNumber = phoneNumber
    if (avatarUrl !== undefined) this.avatarUrl = avatarUrl
    if (roleId) this.roleId = roleId
    this.updatedAt = new Date()
  }

  // Método para atualizar email
  updateEmail(newEmail: string): void {
    this.email = newEmail.toLowerCase().trim()
    this.isVerified = false
    this.emailVerifiedAt = undefined
    this.emailVerificationToken = undefined
    this.updatedAt = new Date()
  }

  // Método para definir nova senha
  updatePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash
    this.failedLoginAttempts = 0
    this.lockedUntil = undefined
    this.passwordResetToken = undefined
    this.passwordResetExpires = undefined
    this.updatedAt = new Date()
  }

  // Método para registrar login bem-sucedido
  registerSuccessfulLogin(): void {
    this.lastLoginAt = new Date()
    this.failedLoginAttempts = 0
    this.lockedUntil = undefined
  }

  // Método para registrar falha de login
  registerFailedLogin(): void {
    this.failedLoginAttempts += 1
    
    // Bloquear conta após 5 tentativas falhas (30 minutos)
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    }
    
    this.updatedAt = new Date()
  }

  // Método para definir token de reset de senha
  setPasswordResetToken(token: string, expiresInHours: number = 24): void {
    this.passwordResetToken = token
    this.passwordResetExpires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    this.updatedAt = new Date()
  }

  // Método para limpar token de reset de senha
  clearPasswordResetToken(): void {
    this.passwordResetToken = undefined
    this.passwordResetExpires = undefined
    this.updatedAt = new Date()
  }

  // Método para definir token de verificação de email
  setEmailVerificationToken(token: string): void {
    this.emailVerificationToken = token
    this.updatedAt = new Date()
  }

  // Método para verificar email
  verifyEmail(): void {
    this.isVerified = true
    this.emailVerifiedAt = new Date()
    this.emailVerificationToken = undefined
    this.updatedAt = new Date()
  }

  // Método para desbloquear conta
  unlockAccount(): void {
    this.failedLoginAttempts = 0
    this.lockedUntil = undefined
    this.updatedAt = new Date()
  }

  // Método para ativar/desativar conta
  setActive(isActive: boolean): void {
    this.isActive = isActive
    this.updatedAt = new Date()
  }

  // Validações de negócio

  // Verificar se a conta está bloqueada
  isLocked(): boolean {
    return this.lockedUntil && new Date() < this.lockedUntil
  }

  // Verificar se o token de reset de senha é válido
  hasValidPasswordResetToken(): boolean {
    return !!(this.passwordResetToken && this.passwordResetExpires && new Date() < this.passwordResetExpires)
  }

  // Verificar se pode fazer reset de senha
  canResetPassword(): boolean {
    return !!(this.passwordResetToken && this.passwordResetExpires && new Date() < this.passwordResetExpires)
  }

  // Verificar se pode fazer login
  canLogin(): boolean {
    return this.isActive && !this.isLocked()
  }

  // Verificar se todos os dados obrigatórios estão preenchidos
  isValid(): boolean {
    return !!(this.name && this.firstName && this.email && this.passwordHash && this.roleId)
  }

  // Verificar se o email é válido
  hasValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.email)
  }

  // Obter nome completo
  getFullName(): string {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName
  }

  // Obter iniciais do nome
  getInitials(): string {
    const firstInitial = this.firstName.charAt(0).toUpperCase()
    const lastInitial = this.lastName ? this.lastName.charAt(0).toUpperCase() : ''
    return `${firstInitial}${lastInitial}`
  }

  // Método para soft delete
  delete(): void {
    this.isDeleted = true
    this.deletedAt = new Date()
  }

  // Método para restaurar usuário deletado
  restore(): void {
    this.isDeleted = false
    this.deletedAt = undefined
  }

  // Verificar se o usuário está ativo (não foi deletado e isActive = true)
  isActiveAndValid(): boolean {
    return !this.isDeleted && this.isActive
  }

  // Verificar se tem permissão para uma operação específica baseada na role
  hasPermission(operation: string): boolean {
    if (!this.role || !this.role.permissions) {
      return false
    }
    return this.role.permissions.includes(operation) || this.role.permissions.includes('*')
  }

  // Verificar se é admin
  isAdmin(): boolean {
    return this.role?.name === 'Admin'
  }

  // Verificar se é gerente
  isManager(): boolean {
    return this.role?.name === 'Manager'
  }

  // Verificar se é usuário comum
  isUser(): boolean {
    return this.role?.name === 'User'
  }
}

export default User