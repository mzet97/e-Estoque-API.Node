import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator'
import CustomerAddress from '../valueObjects/CustomerAddress'

export class AddressViewModel {
  @IsString({ message: 'Street deve ser uma string' })
  @Length(2, 255, { message: 'Street deve ter entre 2 e 255 caracteres' })
  street: string

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

  @IsOptional()
  @IsString({ message: 'Complement deve ser uma string' })
  @Length(0, 255, { message: 'Complement deve ter no máximo 255 caracteres' })
  complement?: string

  @IsOptional()
  @IsString({ message: 'Neighborhood deve ser uma string' })
  @Length(2, 100, { message: 'Neighborhood deve ter entre 2 e 100 caracteres' })
  neighborhood?: string

  toCustomerAddress(): CustomerAddress {
    return new CustomerAddress(
      this.street,
      this.city,
      this.state,
      this.zipCode,
      this.country,
      this.complement,
      this.neighborhood
    )
  }
}

export default class CreateCompanyViewModel {
  @IsString({ message: 'Name deve ser uma string' })
  @Length(2, 255, { message: 'Name deve ter entre 2 e 255 caracteres' })
  name: string

  @IsString({ message: 'DocId deve ser uma string' })
  @Length(11, 18, { message: 'DocId deve ter entre 11 e 18 caracteres (CPF ou CNPJ)' })
  @Matches(/^[\d\.\-\/]+$/, { message: 'DocId deve conter apenas números, pontos, hífens e barras' })
  docId: string

  @IsEmail({}, { message: 'Email deve ser um email válido' })
  @Length(5, 255, { message: 'Email deve ter entre 5 e 255 caracteres' })
  email: string

  @IsOptional()
  @IsString({ message: 'Description deve ser uma string' })
  @Length(0, 1000, { message: 'Description deve ter no máximo 1000 caracteres' })
  description?: string

  @IsOptional()
  @IsString({ message: 'PhoneNumber deve ser uma string' })
  @Length(10, 20, { message: 'PhoneNumber deve ter entre 10 e 20 caracteres' })
  @Matches(/^[\d\-\(\)\s\+]+$/, { message: 'PhoneNumber deve conter apenas números, hífens, parênteses e espaços' })
  phoneNumber?: string

  @IsOptional()
  companyAddress?: AddressViewModel
}
