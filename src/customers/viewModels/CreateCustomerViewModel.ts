import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator'
import { CustomerAddress } from '../valueObjects/CustomerAddress'

export class AddressViewModel {
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
    this.state = state
    this.zipCode = zipCode
    this.country = country
    this.complement = complement
    this.neighborhood = neighborhood
  }

  // Método para converter para CustomerAddress Value Object
  toCustomerAddress(): CustomerAddress {
    return new CustomerAddress(
      this.street,
      this.number,
      this.city,
      this.state,
      this.zipCode,
      this.country,
      this.complement,
      this.neighborhood
    )
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
  ): AddressViewModel {
    return new AddressViewModel(
      street,
      number,
      city,
      state,
      zipCode,
      'Brasil',
      complement,
      neighborhood
    )
  }
}

export default class CreateCustomerViewModel {
  @IsString({ message: 'Name deve ser uma string' })
  @Length(2, 255, { message: 'Name deve ter entre 2 e 255 caracteres' })
  name: string

  @IsString({ message: 'DocId deve ser uma string' })
  @Length(11, 18, { message: 'DocId deve ter entre 11 (CPF) e 14 (CNPJ) caracteres' })
  @Matches(/^\d{11,14}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { 
    message: 'DocId deve ser um CPF ou CNPJ válido (com ou sem formatação)' 
  })
  docId: string

  @IsEmail({}, { message: 'Email deve ser um email válido' })
  email: string

  @IsOptional()
  @IsString({ message: 'Description deve ser uma string' })
  @Length(0, 5000, { message: 'Description deve ter no máximo 5000 caracteres' })
  description?: string

  @IsOptional()
  @IsString({ message: 'ShortDescription deve ser uma string' })
  @Length(0, 500, { message: 'ShortDescription deve ter no máximo 500 caracteres' })
  shortDescription?: string

  @IsOptional()
  @IsString({ message: 'PhoneNumber deve ser uma string' })
  @Length(10, 20, { message: 'PhoneNumber deve ter entre 10 e 20 caracteres' })
  phoneNumber?: string

  @IsOptional()
  customerAddress?: AddressViewModel

  constructor(
    name: string,
    docId: string,
    email: string,
    description?: string,
    shortDescription?: string,
    phoneNumber?: string,
    customerAddress?: AddressViewModel
  ) {
    this.name = name
    this.docId = docId
    this.email = email
    this.description = description
    this.shortDescription = shortDescription
    this.phoneNumber = phoneNumber
    this.customerAddress = customerAddress
  }
}

export default CreateCustomerViewModel