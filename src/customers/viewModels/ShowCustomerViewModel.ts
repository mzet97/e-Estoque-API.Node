import Customer from '../entities/Customer'
import { CustomerAddress } from '../valueObjects/CustomerAddress'

export default class ShowCustomerViewModel {
  id: string
  name: string
  docId: string
  formattedDocId: string
  email: string
  description?: string
  shortDescription?: string
  phoneNumber?: string
  formattedPhone?: string
  personType: 'FISICA' | 'JURIDICA' | 'INVALID'
  documentType: 'CPF' | 'CNPJ' | 'INVALID'
  isValidDocument: boolean
  customerAddress?: CustomerAddress
  formattedAddress?: string
  hasValidAddress: boolean
  isActive: boolean
  createdAt: Date
  updatedAt?: Date

  constructor(customer: Customer) {
    this.id = customer.id
    this.name = customer.name
    this.docId = customer.docId
    this.formattedDocId = customer.getFormattedDocument()
    this.email = customer.email
    this.description = customer.description
    this.shortDescription = customer.shortDescription
    this.phoneNumber = customer.phoneNumber
    this.formattedPhone = customer.getFormattedPhone()
    this.personType = customer.getPersonType()
    this.documentType = customer.getDocumentType()
    this.isValidDocument = customer.isValidDocument()
    this.customerAddress = customer.customerAddress
    this.formattedAddress = customer.customerAddress?.getFormattedAddress()
    this.hasValidAddress = customer.hasValidAddress()
    this.isActive = customer.isActive()
    this.createdAt = customer.createdAt
    this.updatedAt = customer.updatedAt
  }

  static fromCustomer(customer: Customer): ShowCustomerViewModel {
    return new ShowCustomerViewModel(customer)
  }

  static fromCustomers(customers: Customer[]): ShowCustomerViewModel[] {
    return customers.map(customer => new ShowCustomerViewModel(customer))
  }

  // Método para verificar se é pessoa física
  isIndividual(): boolean {
    return this.personType === 'FISICA'
  }

  // Método para verificar se é pessoa jurídica
  isCompany(): boolean {
    return this.personType === 'JURIDICA'
  }

  // Método para obter nome de exibição
  getDisplayName(): string {
    if (this.isCompany() && this.shortDescription) {
      return this.shortDescription
    }
    return this.name
  }

  // Método para verificar se pode fazer compras
  canPurchase(): boolean {
    return this.isActive && this.isValidDocument
  }

  // Método para obter resumo do cliente
  getSummary(): object {
    return {
      id: this.id,
      name: this.getDisplayName(),
      document: this.formattedDocId,
      personType: this.personType,
      email: this.email,
      phone: this.formattedPhone,
      hasAddress: this.hasValidAddress,
      isActive: this.isActive
    }
  }
}