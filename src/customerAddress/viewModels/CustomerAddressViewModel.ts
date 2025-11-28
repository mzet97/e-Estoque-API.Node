import CustomerAddress from '../entities/CustomerAddress'
import Customer from '../../customers/entities/Customer'

export interface CreateCustomerAddressViewModel {
  type: 'shipping' | 'billing' | 'residential'
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
  isDefault?: boolean
  customerId: string
}

export interface UpdateCustomerAddressViewModel {
  type?: 'shipping' | 'billing' | 'residential'
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
  isDefault?: boolean
}

export interface ListCustomerAddressesViewModel {
  customerId?: string
  type?: 'shipping' | 'billing' | 'residential'
  city?: string
  state?: string
  isDefault?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'type' | 'city' | 'state' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

export interface ShowCustomerAddressViewModel {
  id: string
  type: string
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
  isDefault: boolean
  customer?: {
    id: string
    name: string
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

export default class CustomerAddressViewModel {
  static fromCustomerAddress(address: CustomerAddress, includeCustomer: boolean = true): ShowCustomerAddressViewModel {
    return {
      id: address.id,
      type: address.type,
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
      isDefault: address.isDefault,
      customer: includeCustomer && address.customer ? {
        id: address.customer.id,
        name: address.customer.name,
        email: address.customer.email
      } : undefined,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    }
  }

  static fromCustomerAddressList(addresses: CustomerAddress[], includeCustomer: boolean = true): ShowCustomerAddressViewModel[] {
    return addresses.map(address => this.fromCustomerAddress(address, includeCustomer))
  }

  // Método para validar dados de entrada de criação
  static validateCreateData(data: CreateCustomerAddressViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.type || !['shipping', 'billing', 'residential'].includes(data.type)) {
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

    if (!data.customerId) {
      errors.push('CustomerId é obrigatório')
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
  static validateUpdateData(data: UpdateCustomerAddressViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.type && !['shipping', 'billing', 'residential'].includes(data.type)) {
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
  static formatFullAddress(address: CustomerAddress): string {
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
  static formatShortAddress(address: CustomerAddress): string {
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
}