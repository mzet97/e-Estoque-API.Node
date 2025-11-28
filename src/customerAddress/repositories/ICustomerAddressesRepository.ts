import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import CustomerAddress from '../entities/CustomerAddress'

// Interface para filtros de busca de customer addresses
export interface CustomerAddressFilters {
  customerId?: string
  type?: 'shipping' | 'billing' | 'residential'
  city?: string
  state?: string
  isDefault?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'type' | 'city' | 'state' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de customer addresses
export default interface ICustomerAddressesRepository {
  // Operations básicas
  create(address: CustomerAddress): Promise<IResult<CustomerAddress>>
  findById(id: string): Promise<IResult<CustomerAddress>>
  findByCustomerId(customerId: string): Promise<IResult<CustomerAddress[]>>
  findDefault(customerId: string): Promise<IResult<CustomerAddress>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: CustomerAddressFilters): Promise<IPaginationResult<CustomerAddress>>
  
  // Operations de atualização
  update(id: string, address: Partial<CustomerAddress>): Promise<IResult<CustomerAddress>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<CustomerAddress[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<CustomerAddress>>
  
  // Operations de verificação
  existsById(id: string): Promise<boolean>
  isDefault(id: string): Promise<boolean>
  getDefaultCount(customerId: string): Promise<number>
  
  // Operations específicas
  setAsDefault(id: string): Promise<IResult<CustomerAddress>>
  removeDefault(customerId: string): Promise<IResult<CustomerAddress[]>>
  
  // Operation para contar total
  count(): Promise<number>
  countByCustomer(customerId: string): Promise<number>
  countActive(): Promise<number>
  
  // Operations de busca por localização
  findByCity(city: string): Promise<IResult<CustomerAddress[]>>
  findByState(state: string): Promise<IResult<CustomerAddress[]>>
  findByZipCode(zipCode: string): Promise<IResult<CustomerAddress[]>>
}