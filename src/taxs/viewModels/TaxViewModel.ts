import Tax from '../entities/Tax'
import Category from '../../categories/entities/Category'

export interface CreateTaxViewModel {
  name: string
  description?: string
  percentage: number
  idCategory: string
  isActive?: boolean
}

export interface UpdateTaxViewModel {
  name?: string
  description?: string
  percentage?: number
  idCategory?: string
  isActive?: boolean
}

export interface ListTaxesViewModel {
  name?: string
  idCategory?: string
  percentage?: number
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'percentage' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

export interface ShowTaxViewModel {
  id: string
  name: string
  description?: string
  percentage: number
  isActive: boolean
  category?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

export default class TaxViewModel {
  static fromTax(tax: Tax, includeCategory: boolean = true): ShowTaxViewModel {
    return {
      id: tax.id,
      name: tax.name,
      description: tax.description,
      percentage: tax.percentage,
      isActive: tax.isActive,
      category: includeCategory && tax.category ? {
        id: tax.category.id,
        name: tax.category.name
      } : undefined,
      createdAt: tax.createdAt,
      updatedAt: tax.updatedAt
    }
  }

  static fromTaxList(taxes: Tax[], includeCategory: boolean = true): ShowTaxViewModel[] {
    return taxes.map(tax => this.fromTax(tax, includeCategory))
  }

  // Método para validar dados de entrada de criação
  static validateCreateData(data: CreateTaxViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name deve ter pelo menos 2 caracteres')
    }

    if (data.description && data.description.length > 5000) {
      errors.push('Description deve ter no máximo 5000 caracteres')
    }

    if (data.percentage === undefined || data.percentage < 0 || data.percentage > 100) {
      errors.push('Percentage deve ser um número entre 0 e 100')
    }

    if (!data.idCategory) {
      errors.push('IdCategory é obrigatório')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para validar dados de entrada de atualização
  static validateUpdateData(data: UpdateTaxViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.name && data.name.trim().length < 2) {
      errors.push('Name deve ter pelo menos 2 caracteres')
    }

    if (data.description && data.description.length > 5000) {
      errors.push('Description deve ter no máximo 5000 caracteres')
    }

    if (data.percentage !== undefined && (data.percentage < 0 || data.percentage > 100)) {
      errors.push('Percentage deve ser um número entre 0 e 100')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para calcular valor de imposto
  static calculateTaxAmount(baseValue: number, percentage: number): number {
    return (baseValue * percentage) / 100
  }

  // Método para formatar percentual
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`
  }

  // Método para verificar se é um imposto válido
  static isValidTax(tax: Tax): boolean {
    return !!(tax.name && tax.percentage >= 0 && tax.percentage <= 100 && tax.idCategory)
  }
}