import CustomerAddress from '../valueObjects/CustomerAddress'

export class CompanyAddressViewModel {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  complement?: string
  neighborhood?: string

  constructor(address: CustomerAddress) {
    this.street = address.street
    this.city = address.city
    this.state = address.state
    this.zipCode = address.zipCode
    this.country = address.country
    this.complement = address.complement
    this.neighborhood = address.neighborhood
  }

  static fromCustomerAddress(address: CustomerAddress | undefined): CompanyAddressViewModel | null {
    return address ? new CompanyAddressViewModel(address) : null
  }
}

export default class ShowCompanyViewModel {
  id: string
  name: string
  docId: string
  email: string
  description?: string
  phoneNumber?: string
  companyAddress?: CompanyAddressViewModel
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date

  // Fields derived from business logic
  formattedDocument?: string
  formattedPhone?: string
  documentType?: 'CPF' | 'CNPJ' | 'INVALID'

  constructor(company: any) {
    this.id = company.id
    this.name = company.name
    this.docId = company.docId
    this.email = company.email
    this.description = company.description
    this.phoneNumber = company.phoneNumber
    this.companyAddress = CompanyAddressViewModel.fromCustomerAddress(company.companyAddress)
    this.isActive = company.isDeleted === false
    this.createdAt = company.createdAt
    this.updatedAt = company.updatedAt
    this.deletedAt = company.deletedAt

    // Add derived fields if company has the methods
    if (company.getFormattedDocument) {
      this.formattedDocument = company.getFormattedDocument()
    }
    
    if (company.getFormattedPhone) {
      this.formattedPhone = company.getFormattedPhone()
    }
    
    if (company.getDocumentType) {
      this.documentType = company.getDocumentType()
    }
  }

  static fromCompany(company: any): ShowCompanyViewModel {
    return new ShowCompanyViewModel(company)
  }

  static fromCompanyList(companies: any[]): ShowCompanyViewModel[] {
    return companies.map(company => new ShowCompanyViewModel(company))
  }
}
