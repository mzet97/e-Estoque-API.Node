import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Customer from '../entities/Customer'

// Interface para filtros de busca de customers
export interface CustomerFilters {
  name?: string
  email?: string
  docId?: string
  phoneNumber?: string
  personType?: 'FISICA' | 'JURIDICA'
  hasAddress?: boolean
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'email' | 'docId' | 'phoneNumber' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
  search?: string // Para busca em texto livre
}

// Interface para o repository de customers
export default interface ICustomersRepository {
  // Operations básicas
  create(customer: Customer): Promise<IResult<Customer>>
  findById(id: string): Promise<IResult<Customer>>
  findByDocId(docId: string): Promise<IResult<Customer>>
  findByEmail(email: string): Promise<IResult<Customer>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: CustomerFilters): Promise<IPaginationResult<Customer>>
  
  // Operations de atualização
  update(id: string, customer: Partial<Customer>): Promise<IResult<Customer>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Customer[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Customer>>
  
  // Operations de verificação
  existsByDocId(docId: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>
  
  // Operations específicas para customers
  findByPersonType(personType: 'FISICA' | 'JURIDICA'): Promise<IResult<Customer[]>>
  findWithAddress(): Promise<IResult<Customer[]>>
  findWithoutAddress(): Promise<IResult<Customer[]>>
  searchCustomers(searchTerm: string): Promise<IResult<Customer[]>>
  
  // Operations para contar total
  count(): Promise<number>
  countActive(): Promise<number>
  countByPersonType(personType: 'FISICA' | 'JURIDICA'): Promise<number>
  countWithAddress(): Promise<number>
  
  // Operation para buscar customers com dados relacionados
  findWithDetails(id: string): Promise<IResult<Customer>>
}