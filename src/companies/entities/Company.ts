import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'
import CustomerAddress from '../valueObjects/CustomerAddress'

@Entity('companies')
export class Company extends BaseEntity {

  @Column({
    length: 255,
  })
  name: string

  @Column({
    name: 'doc_id',
    length: 18,
    unique: true,
  })
  docId: string

  @Column({
    length: 255,
    unique: true,
  })
  email: string

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description?: string

  @Column({
    name: 'phone_number',
    length: 20,
    nullable: true,
  })
  phoneNumber?: string

  // Store as JSON in database
  @Column({
    name: 'company_address',
    type: 'json',
    nullable: true,
  })
  companyAddress?: CustomerAddress

  constructor() {
    super()
  }

  // Factory method para criar uma nova Company
  static create(
    name: string,
    docId: string,
    email: string,
    description?: string,
    phoneNumber?: string,
    companyAddress?: CustomerAddress
  ): Company {
    const company = new Company()
    company.name = name
    company.docId = docId
    company.email = email
    company.description = description
    company.phoneNumber = phoneNumber
    company.companyAddress = companyAddress
    company.createdAt = new Date()
    return company
  }

  // Método para atualizar os dados da empresa
  update(
    name: string,
    docId: string,
    email: string,
    description?: string,
    phoneNumber?: string,
    companyAddress?: CustomerAddress
  ): void {
    this.name = name
    this.docId = docId
    this.email = email
    this.description = description
    this.phoneNumber = phoneNumber
    this.companyAddress = companyAddress
    this.updatedAt = new Date()
  }

  // Validações de negócio

  // Verificar se o email é válido
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.email)
  }

  // Verificar se o documento é um CPF válido (formato básico)
  isValidCPF(): boolean {
    // Remove caracteres não numéricos
    const cpf = this.docId.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
      return false
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false
    }

    // Verifica primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }
    if (remainder !== parseInt(cpf.charAt(9))) {
      return false
    }

    // Verifica segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }
    return remainder === parseInt(cpf.charAt(10))
  }

  // Verificar se o documento é um CNPJ válido (formato básico)
  isValidCNPJ(): boolean {
    // Remove caracteres não numéricos
    const cnpj = this.docId.replace(/\D/g, '')
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) {
      return false
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false
    }

    // Verifica primeiro dígito verificador
    let sum = 0
    let weight = 5
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder
    if (digit1 !== parseInt(cnpj.charAt(12))) {
      return false
    }

    // Verifica segundo dígito verificador
    sum = 0
    weight = 6
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder
    return digit2 === parseInt(cnpj.charAt(13))
  }

  // Verificar se é pessoa física ou jurídica baseado no documento
  getDocumentType(): 'CPF' | 'CNPJ' | 'INVALID' {
    const cleanDoc = this.docId.replace(/\D/g, '')
    
    if (cleanDoc.length === 11 && this.isValidCPF()) {
      return 'CPF'
    } else if (cleanDoc.length === 14 && this.isValidCNPJ()) {
      return 'CNPJ'
    }
    return 'INVALID'
  }

  // Verificar se a empresa tem endereço válido
  hasValidAddress(): boolean {
    return this.companyAddress ? this.companyAddress.isValid() : false
  }

  // Verificar se o telefone é válido (formato brasileiro)
  isValidPhoneNumber(): boolean {
    if (!this.phoneNumber) {
      return true // Telefone é opcional
    }
    
    // Remove caracteres não numéricos
    const phone = this.phoneNumber.replace(/\D/g, '')
    
    // Verifica se tem entre 10 e 11 dígitos (celular com 9º dígito)
    return phone.length >= 10 && phone.length <= 11
  }

  // Verificar se todos os dados obrigatórios estão preenchidos
  isValid(): boolean {
    return !!(this.name && 
             this.docId && 
             this.email && 
             this.isValidEmail() &&
             this.getDocumentType() !== 'INVALID')
  }

  // Formatar o documento para exibição
  getFormattedDocument(): string {
    const docType = this.getDocumentType()
    const cleanDoc = this.docId.replace(/\D/g, '')
    
    if (docType === 'CPF') {
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (docType === 'CNPJ') {
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    
    return this.docId
  }

  // Formatar o telefone para exibição
  getFormattedPhone(): string {
    if (!this.phoneNumber) {
      return ''
    }
    
    const phone = this.phoneNumber.replace(/\D/g, '')
    
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    
    return this.phoneNumber
  }

  // Método para soft delete
  delete(): void {
    this.isDeleted = true
    this.deletedAt = new Date()
  }

  // Método para restaurar empresa deletada
  restore(): void {
    this.isDeleted = false
    this.deletedAt = undefined
  }

  // Verificar se a empresa está ativa (não foi deletada)
  isActive(): boolean {
    return !this.isDeleted
  }
}

export default Company
