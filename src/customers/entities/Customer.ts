import { BaseEntity } from '@shared/entities/BaseEntity'
import CustomerAddress from '../valueObjects/CustomerAddress'
import { Column, Entity } from 'typeorm'
import { DocumentValidationService } from '@shared/services/DocumentValidationService'

@Entity('customers')
class Customer extends BaseEntity {

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
        name: 'short_description',
        length: 500,
        nullable: true,
    })
    shortDescription?: string

    @Column({
        name: 'phone_number',
        length: 20,
        nullable: true,
    })
    phoneNumber?: string

    // Store as JSON in database
    @Column({
        name: 'customer_address',
        type: 'json',
        nullable: true,
    })
    customerAddress?: CustomerAddress

    constructor() {
        super()
    }

    // Factory method para criar um novo Customer
    static create(
        name: string,
        docId: string,
        email: string,
        description?: string,
        shortDescription?: string,
        phoneNumber?: string,
        customerAddress?: CustomerAddress
    ): Customer {
        const customer = new Customer()
        customer.name = name
        customer.docId = docId
        customer.email = email
        customer.description = description
        customer.shortDescription = shortDescription
        customer.phoneNumber = phoneNumber
        customer.customerAddress = customerAddress
        customer.createdAt = new Date()
        return customer
    }

    // Método para atualizar os dados do cliente
    update(
        name: string,
        docId: string,
        email: string,
        description?: string,
        shortDescription?: string,
        phoneNumber?: string,
        customerAddress?: CustomerAddress
    ): void {
        this.name = name
        this.docId = docId
        this.email = email
        this.description = description
        this.shortDescription = shortDescription
        this.phoneNumber = phoneNumber
        this.customerAddress = customerAddress
        this.updatedAt = new Date()
    }

    // Validações de negócio

    // Verificar se o email é válido
    isValidEmail(): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(this.email)
    }

    // Verificar se o documento é válido (CPF ou CNPJ)
    isValidDocument(): boolean {
        return DocumentValidationService.validateDocument(this.docId)
    }

    // Obter o tipo de documento
    getDocumentType(): 'CPF' | 'CNPJ' | 'INVALID' {
        return DocumentValidationService.getDocumentType(this.docId)
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

    // Verificar se o cliente tem endereço válido
    hasValidAddress(): boolean {
        return this.customerAddress ? this.customerAddress.isValid() : false
    }

    // Verificar se todos os dados obrigatórios estão preenchidos
    isValid(): boolean {
        return !!(this.name && 
                 this.docId && 
                 this.email && 
                 this.isValidEmail() &&
                 this.getDocumentType() !== 'INVALID')
    }

    // Verificar se é pessoa física ou jurídica baseado no documento
    getPersonType(): 'FISICA' | 'JURIDICA' | 'INVALID' {
        const docType = this.getDocumentType()
        if (docType === 'CPF') return 'FISICA'
        if (docType === 'CNPJ') return 'JURIDICA'
        return 'INVALID'
    }

    // Formatar o documento para exibição
    getFormattedDocument(): string {
        return DocumentValidationService.formatDocument(this.docId)
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

    // Método para restaurar cliente deletado
    restore(): void {
        this.isDeleted = false
        this.deletedAt = undefined
    }

    // Verificar se o cliente está ativo (não foi deletado)
    isActive(): boolean {
        return !this.isDeleted
    }

    // Verificar se o cliente é uma pessoa física (CPF)
    isIndividual(): boolean {
        return this.getPersonType() === 'FISICA'
    }

    // Verificar se o cliente é uma pessoa jurídica (CNPJ)
    isCompany(): boolean {
        return this.getPersonType() === 'JURIDICA'
    }

    // Obter nome de exibição (usando nome ou razão social baseado no tipo)
    getDisplayName(): string {
        if (this.isCompany() && this.shortDescription) {
            return this.shortDescription
        }
        return this.name
    }

  // Método para validar se o cliente pode fazer compras
  canPurchase(): boolean {
    return this.isActive() && this.isValid()
  }
}

export default Customer