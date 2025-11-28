import { IsString, IsOptional, Length, Matches, IsEnum, IsBoolean, IsNumber } from 'class-validator'

export enum DeliveryType {
  STANDARD = 'STANDARD',       // Entrega padrão
  EXPRESS = 'EXPRESS',         // Entrega expressa
  SCHEDULED = 'SCHEDULED',     // Entrega agendada
  PICKUP = 'PICKUP',           // Retirada no local
  SAME_DAY = 'SAME_DAY',       // Entrega no mesmo dia
  WEEKEND = 'WEEKEND',         // Entrega de fim de semana
  EMERGENCY = 'EMERGENCY'      // Entrega de emergência
}

export enum AddressType {
  RESIDENTIAL = 'RESIDENTIAL',   // Residencial
  COMMERCIAL = 'COMMERCIAL',     // Comercial
  INDUSTRIAL = 'INDUSTRIAL',     // Industrial
  RURAL = 'RURAL',               // Rural
  CONDO = 'CONDO',               // Condomínio
  BUILDING = 'BUILDING'          // Prédio/Edifício
}

export class SaleAddress {
  // Endereço básico
  @IsString({ message: 'Street deve ser uma string' })
  @Length(2, 255, { message: 'Street deve ter entre 2 e 255 caracteres' })
  street: string

  @IsString({ message: 'Number deve ser uma string' })
  @Length(1, 20, { message: 'Number deve ter entre 1 e 20 caracteres' })
  number: string

  @IsOptional()
  @IsString({ message: 'Complement deve ser uma string' })
  @Length(0, 255, { message: 'Complement deve ter no máximo 255 caracteres' })
  complement?: string

  @IsOptional()
  @IsString({ message: 'Neighborhood deve ser uma string' })
  @Length(2, 100, { message: 'Neighborhood deve ter entre 2 e 100 caracteres' })
  neighborhood?: string

  @IsString({ message: 'City deve ser uma string' })
  @Length(2, 100, { message: 'City deve ter entre 2 e 100 caracteres' })
  city: string

  @IsString({ message: 'State deve ser uma string' })
  @Length(2, 2, { message: 'State deve ter exatamente 2 caracteres (UF)' })
  @Matches(/^[A-Z]{2}$/, { message: 'State deve ser uma UF válida (ex: SP, RJ, MG)' })
  state: string

  @IsString({ message: 'ZipCode deve ser uma string' })
  @Length(8, 9, { message: 'ZipCode deve ter 8 ou 9 caracteres' })
  @Matches(/^\d{5}-?\d{3}$/, { message: 'ZipCode deve estar no formato 00000-000 ou 00000000' })
  zipCode: string

  @IsString({ message: 'Country deve ser uma string' })
  @Length(2, 100, { message: 'Country deve ter entre 2 e 100 caracteres' })
  country: string

  // Informações de entrega específicas
  @IsOptional()
  @IsEnum(DeliveryType, { message: 'DeliveryType deve ser um dos valores válidos' })
  deliveryType?: DeliveryType

  @IsOptional()
  @IsEnum(AddressType, { message: 'AddressType deve ser um dos valores válidos' })
  addressType?: AddressType

  @IsOptional()
  @IsString({ message: 'DeliveryInstructions deve ser uma string' })
  @Length(0, 500, { message: 'DeliveryInstructions deve ter no máximo 500 caracteres' })
  deliveryInstructions?: string

  @IsOptional()
  @IsString({ message: 'Landmark deve ser uma string' })
  @Length(0, 255, { message: 'Landmark deve ter no máximo 255 caracteres' })
  landmark?: string

  @IsOptional()
  @IsString({ message: 'DeliveryTimePreference deve ser uma string' })
  @Length(0, 100, { message: 'DeliveryTimePreference deve ter no máximo 100 caracteres' })
  deliveryTimePreference?: string

  @IsOptional()
  @IsString({ message: 'ContactName deve ser uma string' })
  @Length(2, 100, { message: 'ContactName deve ter entre 2 e 100 caracteres' })
  contactName?: string

  @IsOptional()
  @IsString({ message: 'ContactPhone deve ser uma string' })
  @Length(10, 20, { message: 'ContactPhone deve ter entre 10 e 20 caracteres' })
  contactPhone?: string

  @IsOptional()
  @IsString({ message: 'DeliveryNotes deve ser uma string' })
  @Length(0, 500, { message: 'DeliveryNotes deve ter no máximo 500 caracteres' })
  deliveryNotes?: string

  @IsOptional()
  @IsBoolean({ message: 'HasIntercom deve ser um boolean' })
  hasIntercom?: boolean

  @IsOptional()
  @IsBoolean({ message: 'HasElevator deve ser um boolean' })
  hasElevator?: boolean

  @IsOptional()
  @IsNumber({}, { message: 'Floor deve ser um número' })
  floor?: number

  @IsOptional()
  @IsString({ message: 'Apartment deve ser uma string' })
  @Length(0, 20, { message: 'Apartment deve ter no máximo 20 caracteres' })
  apartment?: string

  // Coordenadas geográficas
  @IsOptional()
  @IsString({ message: 'Latitude deve ser uma string' })
  @Matches(/^-?\d{1,3}\.\d+$/, { message: 'Latitude deve ser um número decimal válido' })
  latitude?: string

  @IsOptional()
  @IsString({ message: 'Longitude deve ser uma string' })
  @Matches(/^-?\d{1,3}\.\d+$/, { message: 'Longitude deve ser um número decimal válido' })
  longitude?: string

  constructor(
    street: string,
    number: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
    complement?: string,
    neighborhood?: string,
    deliveryType?: DeliveryType,
    addressType?: AddressType,
    deliveryInstructions?: string,
    landmark?: string,
    deliveryTimePreference?: string,
    contactName?: string,
    contactPhone?: string,
    deliveryNotes?: string,
    hasIntercom?: boolean,
    hasElevator?: boolean,
    floor?: number,
    apartment?: string,
    latitude?: string,
    longitude?: string
  ) {
    this.street = street
    this.number = number
    this.city = city
    this.state = state.toUpperCase() // Normalizar para maiúsculo
    this.zipCode = this.formatZipCode(zipCode) // Formatar CEP
    this.country = country
    this.complement = complement
    this.neighborhood = neighborhood
    this.deliveryType = deliveryType
    this.addressType = addressType
    this.deliveryInstructions = deliveryInstructions
    this.landmark = landmark
    this.deliveryTimePreference = deliveryTimePreference
    this.contactName = contactName
    this.contactPhone = contactPhone
    this.deliveryNotes = deliveryNotes
    this.hasIntercom = hasIntercom
    this.hasElevator = hasElevator
    this.floor = floor
    this.apartment = apartment
    this.latitude = latitude
    this.longitude = longitude
  }

  // Método para formatar o CEP
  private formatZipCode(zipCode: string): string {
    const digitsOnly = zipCode.replace(/\D/g, '')
    
    if (digitsOnly.length === 8) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`
    }
    
    return digitsOnly
  }

  // Verificar se é um endereço brasileiro
  isBrazilian(): boolean {
    return this.country.toLowerCase() === 'brasil' || this.country.toLowerCase() === 'brazil'
  }

  // Verificar se tem coordenadas geográficas
  hasCoordinates(): boolean {
    return !!(this.latitude && this.longitude)
  }

  // Verificar se tem informações de contato
  hasContactInfo(): boolean {
    return !!(this.contactName && this.contactPhone)
  }

  // Verificar se é um endereço comercial
  isCommercial(): boolean {
    return this.addressType === AddressType.COMMERCIAL
  }

  // Verificar se é um endereço residencial
  isResidential(): boolean {
    return this.addressType === AddressType.RESIDENTIAL
  }

  // Verificar se é um endereço industrial
  isIndustrial(): boolean {
    return this.addressType === AddressType.INDUSTRIAL
  }

  // Verificar se requer entrega especial
  requiresSpecialDelivery(): boolean {
    return !!(
      this.deliveryType === DeliveryType.EXPRESS ||
      this.deliveryType === DeliveryType.SAME_DAY ||
      this.deliveryType === DeliveryType.EMERGENCY ||
      !this.hasElevator && this.floor && this.floor > 3
    )
  }

  // Verificar se é adequado para entrega de grande volume
  isSuitableForBulkDelivery(): boolean {
    return this.addressType === AddressType.COMMERCIAL || 
           this.addressType === AddressType.INDUSTRIAL
  }

  // Verificar se tem restrições de acesso
  hasAccessRestrictions(): boolean {
    return !!(
      this.hasIntercom ||
      (this.floor && this.floor > 0) ||
      this.apartment
    )
  }

  // Verificar se tem ponto de referência
  hasLandmark(): boolean {
    return !!this.landmark
  }

  // Verificar se tem instruções de entrega
  hasDeliveryInstructions(): boolean {
    return !!this.deliveryInstructions
  }

  // Obter o endereço formatado para exibição
  getFormattedAddress(): string {
    let address = `${this.street}, ${this.number}`
    
    if (this.complement) {
      address += `, ${this.complement}`
    }
    
    if (this.apartment) {
      address += `, Apto ${this.apartment}`
    }
    
    if (this.floor) {
      address += `, ${this.floor}º andar`
    }
    
    if (this.neighborhood) {
      address += ` - ${this.neighborhood}`
    }
    
    address += `, ${this.city}/${this.state}`
    address += ` - ${this.zipCode}`
    
    return address
  }

  // Obter endereço completo para etiquetas de entrega
  getDeliveryLabel(): string {
    let label = `${this.getFormattedAddress()}\n`
    
    if (this.country && !this.isBrazilian()) {
      label += `${this.country}\n`
    }
    
    if (this.contactName) {
      label += `Destinatário: ${this.contactName}\n`
    }
    
    if (this.contactPhone) {
      label += `Tel: ${this.contactPhone}\n`
    }
    
    if (this.landmark) {
      label += `Referência: ${this.landmark}\n`
    }
    
    if (this.deliveryInstructions) {
      label += `Instruções: ${this.deliveryInstructions}\n`
    }
    
    return label.trim()
  }

  // Obter coordenadas como números
  getCoordinates(): { lat: number; lng: number } | null {
    if (this.hasCoordinates()) {
      return {
        lat: parseFloat(this.latitude!),
        lng: parseFloat(this.longitude!)
      }
    }
    return null
  }

  // Calcular distância aproximada (usando coordenadas)
  calculateDistanceTo(otherAddress: SaleAddress): number | null {
    if (!this.hasCoordinates() || !otherAddress.hasCoordinates()) {
      return null
    }

    const coords1 = this.getCoordinates()!
    const coords2 = otherAddress.getCoordinates()!

    const R = 6371 // Raio da Terra em km
    const dLat = this.toRadians(coords2.lat - coords1.lat)
    const dLon = this.toRadians(coords2.lng - coords1.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coords1.lat)) * Math.cos(this.toRadians(coords2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Verificar se dois endereços são iguais
  equals(other: SaleAddress): boolean {
    return this.street === other.street &&
           this.number === other.number &&
           this.city === other.city &&
           this.state === other.state &&
           this.zipCode === other.zipCode &&
           this.country === other.country &&
           this.complement === other.complement &&
           this.neighborhood === other.neighborhood
  }

  // Verificar se é um endereço válido para entrega
  isValidForDelivery(): boolean {
    return !!(this.street && 
             this.number && 
             this.city && 
             this.state && 
             this.zipCode && 
             this.country)
  }

  // Verificar se todos os campos obrigatórios estão preenchidos
  isValid(): boolean {
    return this.isValidForDelivery()
  }

  // Método estático para criar um endereço brasileiro padrão
  static createBrazilian(
    street: string,
    number: string,
    city: string,
    state: string,
    zipCode: string,
    complement?: string,
    neighborhood?: string,
    deliveryType?: DeliveryType,
    addressType?: AddressType,
    deliveryInstructions?: string,
    landmark?: string,
    contactName?: string,
    contactPhone?: string,
    hasIntercom?: boolean,
    hasElevator?: boolean,
    floor?: number,
    apartment?: string
  ): SaleAddress {
    return new SaleAddress(
      street,
      number,
      city,
      state,
      zipCode,
      'Brasil',
      complement,
      neighborhood,
      deliveryType,
      addressType,
      deliveryInstructions,
      landmark,
      undefined,
      contactName,
      contactPhone,
      undefined,
      hasIntercom,
      hasElevator,
      floor,
      apartment
    )
  }

  // Obter resumo do endereço para listagens
  getSummary(): object {
    return {
      formattedAddress: this.getFormattedAddress(),
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      addressType: this.addressType,
      deliveryType: this.deliveryType,
      hasContactInfo: this.hasContactInfo(),
      hasCoordinates: this.hasCoordinates(),
      requiresSpecialDelivery: this.requiresSpecialDelivery(),
      isCommercial: this.isCommercial(),
      isValid: this.isValid()
    }
  }

  // Clonar endereço
  clone(): SaleAddress {
    return new SaleAddress(
      this.street,
      this.number,
      this.city,
      this.state,
      this.zipCode,
      this.country,
      this.complement,
      this.neighborhood,
      this.deliveryType,
      this.addressType,
      this.deliveryInstructions,
      this.landmark,
      this.deliveryTimePreference,
      this.contactName,
      this.contactPhone,
      this.deliveryNotes,
      this.hasIntercom,
      this.hasElevator,
      this.floor,
      this.apartment,
      this.latitude,
      this.longitude
    )
  }
}

export default SaleAddress