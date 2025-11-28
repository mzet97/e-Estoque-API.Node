import { IsString, IsOptional, Length, Matches, IsUUID } from 'class-validator'
import { AddressViewModel } from './CreateCustomerViewModel'

export default class UpdateCustomerViewModel {
  @IsOptional()
  @IsString({ message: 'Name deve ser uma string' })
  @Length(2, 255, { message: 'Name deve ter entre 2 e 255 caracteres' })
  name?: string

  @IsOptional()
  @IsString({ message: 'DocId deve ser uma string' })
  @Length(11, 18, { message: 'DocId deve ter entre 11 (CPF) e 14 (CNPJ) caracteres' })
  @Matches(/^\d{11,14}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { 
    message: 'DocId deve ser um CPF ou CNPJ válido (com ou sem formatação)' 
  })
  docId?: string

  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email?: string

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

  @IsOptional()
  @IsString({ message: 'Customer ID deve ser uma string' })
  @IsUUID(4, { message: 'Customer ID deve ser um UUID válido' })
  customerId?: string

  constructor(
    name?: string,
    docId?: string,
    email?: string,
    description?: string,
    shortDescription?: string,
    phoneNumber?: string,
    customerAddress?: AddressViewModel,
    customerId?: string
  ) {
    this.name = name
    this.docId = docId
    this.email = email
    this.description = description
    this.shortDescription = shortDescription
    this.phoneNumber = phoneNumber
    this.customerAddress = customerAddress
    this.customerId = customerId
  }
}