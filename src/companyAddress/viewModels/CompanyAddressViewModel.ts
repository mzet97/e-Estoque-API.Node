import CompanyAddress from '../entities/CompanyAddress'
import Company from '../../companies/entities/Company'

export interface CreateCompanyAddressViewModel {
  type: 'headquarters' | 'branch' | 'warehouse' | 'billing' | 'shipping'
  department?: string
  contactPerson?: string
  phone?: string
  email?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  district: string
  city: string
  state: string
  country?: string
  zipCode: string
  latitude?: number
  longitude?: number
  isHeadquarters?: boolean
  isActive?: boolean
  companyId: string
}

export interface UpdateCompanyAddressViewModel {
  type?: 'headquarters' | 'branch' | 'warehouse' | 'billing' | 'shipping'
  department?: string
  contactPerson?: string
  phone?: string
  email?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  district?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  isHeadquarters?: boolean
  isActive?: boolean
}

export interface ListCompanyAddressesViewModel {
  companyId?: string
  type?: 'headquarters' | 'branch' | 'warehouse' | 'billing' | 'shipping'
  city?: string
  state?: string
  isHeadquarters?: boolean
  isActive?: boolean
  department?: string
  contactPerson?: string
  page?: number
  pageSize?: number
  orderBy?: 'type' | 'city' | 'state' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

export interface ShowCompanyAddressViewModel {
  id: string
  type: string
  department?: string
  contactPerson?: string
  phone?: string
  email?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  district: string
  city: string
  state: string
  country: string
  zipCode: string
  latitude?: number
  longitude?: number
  isHeadquarters: boolean
  isActive: boolean
  company?: {
    id: string
    name: string
    docId: string
  }
  createdAt: Date
  updatedAt: Date
}

export default class CompanyAddressViewModel {
  static fromCompanyAddress(address: CompanyAddress, includeCompany: boolean = true): ShowCompanyAddressViewModel {
    return {
      id: address.id,
      type: address.type,
      department: address.department,
      contactPerson: address.contactPerson,
      phone: address.phone,
      email: address.email,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      district: address.district,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      latitude: address.latitude,
      longitude: address.longitude,
      isHeadquarters: address.isHeadquarters,
      isActive: address.isActive,
      company: includeCompany && address.company ? {
        id: address.company.id,
        name: address.company.name,
        docId: address.company.docId
      } : undefined,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    }
  }

  static fromCompanyAddressList(addresses: CompanyAddress[], includeCompany: boolean = true): ShowCompanyAddressViewModel[] {
    return addresses.map(address => this.fromCompanyAddress(address, includeCompany))
  }

  // Método para validar dados de entrada de criação
  static validateCreateData(data: CreateCompanyAddressViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.type || !['headquarters', 'branch', 'warehouse', 'billing', 'shipping'].includes(data.type)) {
      errors.push('Type deve ser uma das opções válidas')
    }

    if (!data.street || data.street.trim().length < 2) {
      errors.push('Street deve ter pelo menos 2 caracteres')
    }

    if (!data.number || data.number.trim().length < 1) {
      errors.push('Number é obrigatório')
    }

    if (!data.neighborhood || data.neighborhood.trim().length < 2) {
      errors.push('Neighborhood deve ter pelo menos 2 caracteres')
    }

    if (!data.district || data.district.trim().length < 2) {
      errors.push('District deve ter pelo menos 2 caracteres')
    }

    if (!data.city || data.city.trim().length < 2) {
      errors.push('City deve ter pelo menos 2 caracteres')
    }

    if (!data.state || data.state.length !== 2) {
      errors.push('State deve ter exatamente 2 caracteres (UF)')
    }

    if (!data.zipCode || !this.isValidZipCode(data.zipCode)) {
      errors.push('ZipCode deve estar no formato 00000-000 ou 00000000')
    }

    if (!data.companyId) {
      errors.push('CompanyId é obrigatório')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Phone deve conter apenas números, hífens, parênteses e espaços')
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email deve ser válido')
    }

    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      errors.push('Latitude deve estar entre -90 e 90')
    }

    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      errors.push('Longitude deve estar entre -180 e 180')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para validar dados de entrada de atualização
  static validateUpdateData(data: UpdateCompanyAddressViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.type && !['headquarters', 'branch', 'warehouse', 'billing', 'shipping'].includes(data.type)) {
      errors.push('Type deve ser uma das opções válidas')
    }

    if (data.street && data.street.trim().length < 2) {
      errors.push('Street deve ter pelo menos 2 caracteres')
    }

    if (data.number && data.number.trim().length < 1) {
      errors.push('Number é obrigatório')
    }

    if (data.neighborhood && data.neighborhood.trim().length < 2) {
      errors.push('Neighborhood deve ter pelo menos 2 caracteres')
    }

    if (data.district && data.district.trim().length < 2) {
      errors.push('District deve ter pelo menos 2 caracteres')
    }

    if (data.city && data.city.trim().length < 2) {
      errors.push('City deve ter pelo menos 2 caracteres')
    }

    if (data.state && data.state.length !== 2) {
      errors.push('State deve ter exatamente 2 caracteres (UF)')
    }

    if (data.zipCode && !this.isValidZipCode(data.zipCode)) {
      errors.push('ZipCode deve estar no formato 00000-000 ou 00000000')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Phone deve conter apenas números, hífens, parênteses e espaços')
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email deve ser válido')
    }

    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      errors.push('Latitude deve estar entre -90 e 90')
    }

    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      errors.push('Longitude deve estar entre -180 e 180')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para formatar endereço completo
  static formatFullAddress(address: CompanyAddress): string {
    const parts = [
      `${address.street}, ${address.number}`,
      address.complement,
      address.neighborhood,
      address.district,
      `${address.city}/${address.state}`,
      address.zipCode
    ].filter(Boolean)

    return parts.join(', ')
  }

  // Método para gerar endereço curto
  static formatShortAddress(address: CompanyAddress): string {
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`
  }

  // Método para formatar CEP
  static formatZipCode(zipCode: string): string {
    const cleaned = zipCode.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    }
    return zipCode
  }

  // Métodos auxiliares para validação
  private static isValidZipCode(zipCode: string): boolean {
    const zipCodeRegex = /^\d{5}-?\d{3}$/
    return zipCodeRegex.test(zipCode)
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\-\(\)\s\+]+$/
    return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}