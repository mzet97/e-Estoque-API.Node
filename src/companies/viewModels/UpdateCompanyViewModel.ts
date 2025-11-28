import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator'
import CustomerAddress from '../valueObjects/CustomerAddress'
import { AddressViewModel } from './CreateCompanyViewModel'

export default class UpdateCompanyViewModel {
  @IsOptional()
  @IsString({ message: 'Name deve ser uma string' })
  @Length(2, 255, { message: 'Name deve ter entre 2 e 255 caracteres' })
  name?: string

  @IsOptional()
  @IsString({ message: 'DocId deve ser uma string' })
  @Length(11, 18, { message: 'DocId deve ter entre 11 e 18 caracteres (CPF ou CNPJ)' })
  @Matches(/^[\d\.\-\/]+$/, { message: 'DocId deve conter apenas números, pontos, hífens e barras' })
  docId?: string

  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser um email válido' })
  @Length(5, 255, { message: 'Email deve ter entre 5 e 255 caracteres' })
  email?: string

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
