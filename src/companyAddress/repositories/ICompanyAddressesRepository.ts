import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import CompanyAddress from '../entities/CompanyAddress'

// Interface para filtros de busca de company addresses
export interface CompanyAddressFilters {
  companyId?: string
  type?: 'headquarters' | 'branch' | 'warehouse' | 'billing' | 'shipping'
  city?: string
  state?: string
  isHeadquarters?: boolean
  isActive?: boolean
  department?: string
  contactPerson?: string
  page?: number
  pageSize?: number
  orderBy?: 'type' | 'city' | 'state' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de company addresses
export default interface ICompanyAddressesRepository {
  // Operations básicas
  create(address: CompanyAddress): Promise<IResult<CompanyAddress>>
  findById(id: string): Promise<IResult<CompanyAddress>>
  findByCompanyId(companyId: string): Promise<IResult<CompanyAddress[]>>
  findHeadquarters(companyId: string): Promise<IResult<CompanyAddress>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: CompanyAddressFilters): Promise<IPaginationResult<CompanyAddress>>
  
  // Operations de atualização
  update(id: string, address: Partial<CompanyAddress>): Promise<IResult<CompanyAddress>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<CompanyAddress[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<CompanyAddress>>
  
  // Operations de verificação
  existsById(id: string): Promise<boolean>
  isHeadquarters(id: string): Promise<boolean>
  getHeadquartersCount(companyId: string): Promise<number>
  
  // Operations específicas
  setAsHeadquarters(id: string): Promise<IResult<CompanyAddress>>
  removeHeadquarters(companyId: string): Promise<IResult<CompanyAddress[]>>
  
  // Operation para contar total
  count(): Promise<number>
  countByCompany(companyId: string): Promise<number>
  countActive(): Promise<number>
  
  // Operations de busca por localização
  findByCity(city: string): Promise<IResult<CompanyAddress[]>>
  findByState(state: string): Promise<IResult<CompanyAddress[]>>
  findByZipCode(zipCode: string): Promise<IResult<CompanyAddress[]>>
}