import { IsString, IsOptional, Length, Matches } from 'class-validator'

export class CustomerAddress {
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

  constructor(
    street: string,
    number: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
    complement?: string,
    neighborhood?: string
  ) {
    this.street = street
    this.number = number
    this.city = city
    this.state = state.toUpperCase() // Normalizar para maiúsculo
    this.zipCode = this.formatZipCode(zipCode) // Formatar CEP
    this.country = country
    this.complement = complement
    this.neighborhood = neighborhood
  }

  // Método para formatar o CEP
  private formatZipCode(zipCode: string): string {
    // Remove caracteres não numéricos
    const digitsOnly = zipCode.replace(/\D/g, '')
    
    // Aplica máscara 00000-000 se tiver 8 dígitos
    if (digitsOnly.length === 8) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`
    }
    
    return digitsOnly // Retorna sem formatação se tiver menos de 8 dígitos
  }

  // Método para verificar se é um endereço brasileiro
  isBrazilian(): boolean {
    return this.country.toLowerCase() === 'brasil' || this.country.toLowerCase() === 'brazil'
  }

  // Método para obter o endereço formatado
  getFormattedAddress(): string {
    let address = `${this.street}, ${this.number}`
    if (this.complement) {
      address += `, ${this.complement}`
    }
    if (this.neighborhood) {
      address += ` - ${this.neighborhood}`
    }
    address += `, ${this.city}/${this.state}`
    address += ` - ${this.zipCode}`
    return address
  }

  // Método para comparar com outro endereço
  equals(other: CustomerAddress): boolean {
    return this.street === other.street &&
           this.number === other.number &&
           this.city === other.city &&
           this.state === other.state &&
           this.zipCode === other.zipCode &&
           this.country === other.country &&
           this.complement === other.complement &&
           this.neighborhood === other.neighborhood
  }

  // Método para validar se os campos obrigatórios estão preenchidos
  isValid(): boolean {
    return !!(this.street && this.number && this.city && this.state && this.zipCode && this.country)
  }

  // Método estático para criar um endereço brasileiro padrão
  static createBrazilian(
    street: string,
    number: string,
    city: string,
    state: string,
    zipCode: string,
    complement?: string,
    neighborhood?: string
  ): CustomerAddress {
    return new CustomerAddress(street, number, city, state, zipCode, 'Brasil', complement, neighborhood)
  }

  // Método para formatar o CEP para exibição
  getFormattedZipCode(): string {
    return this.zipCode
  }
}

export { CustomerAddress }
export default CustomerAddress