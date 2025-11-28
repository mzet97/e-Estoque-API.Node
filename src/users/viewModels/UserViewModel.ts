import User from '../entities/User'
import { Role } from '../../roles/entities/Role'

export interface CreateUserViewModel {
  name: string
  email: string
  firstName: string
  lastName?: string
  phoneNumber?: string
  roleId: string
  avatarUrl?: string
}

export interface UpdateUserViewModel {
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  roleId?: string
  avatarUrl?: string
}

export interface ListUsersViewModel {
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

export interface ChangePasswordViewModel {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordViewModel {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ForgotPasswordViewModel {
  email: string
}

export interface ResendEmailVerificationViewModel {
  email: string
}

export interface ShowUserViewModel {
  id: string
  name: string
  email: string
  firstName: string
  lastName?: string
  phoneNumber?: string
  avatarUrl?: string
  isActive: boolean
  isVerified: boolean
  lastLoginAt?: Date
  role: {
    id: string
    name: string
    description?: string
    permissions: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export default class UserViewModel {
  static fromUser(user: User, includeRole: boolean = true): ShowUserViewModel {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      role: includeRole && user.role ? {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions: user.role.permissions || []
      } : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  static fromUserList(users: User[], includeRole: boolean = true): ShowUserViewModel[] {
    return users.map(user => this.fromUser(user, includeRole))
  }

  // Método para mapear para apresentação (sem dados sensíveis)
  static toPresentation(user: User): Partial<ShowUserViewModel> {
    return {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions || []
      } : undefined
    }
  }

  // Método para validar dados de entrada de criação
  static validateCreateData(data: CreateUserViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email deve ser válido')
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.push('Primeiro nome deve ter pelo menos 2 caracteres')
    }

    if (!data.roleId) {
      errors.push('RoleId é obrigatório')
    }

    if (data.phoneNumber && !this.isValidPhone(data.phoneNumber)) {
      errors.push('Telefone deve conter apenas números, hífens, parênteses e espaços')
    }

    if (data.avatarUrl && !this.isValidUrl(data.avatarUrl)) {
      errors.push('AvatarUrl deve ser uma URL válida')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para validar dados de entrada de atualização
  static validateUpdateData(data: UpdateUserViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.name && data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email deve ser válido')
    }

    if (data.firstName && data.firstName.trim().length < 2) {
      errors.push('Primeiro nome deve ter pelo menos 2 caracteres')
    }

    if (data.phoneNumber && !this.isValidPhone(data.phoneNumber)) {
      errors.push('Telefone deve conter apenas números, hífens, parênteses e espaços')
    }

    if (data.avatarUrl && !this.isValidUrl(data.avatarUrl)) {
      errors.push('AvatarUrl deve ser uma URL válida')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para validar nova senha
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!password || password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Senha deve conter pelo menos um número')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para formatar nome completo
  static formatFullName(firstName: string, lastName?: string): string {
    return lastName ? `${firstName} ${lastName}` : firstName
  }

  // Método para gerar iniciais do nome
  static generateInitials(firstName: string, lastName?: string): string {
    const firstInitial = firstName.charAt(0).toUpperCase()
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ''
    return `${firstInitial}${lastInitial}`
  }

  // Métodos auxiliares para validação
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\-\(\)\s\+]+$/
    return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}