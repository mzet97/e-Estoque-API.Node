import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Company from '../entities/Company'

// Interface para filtros de busca de companies
export interface CompanyFilters {
  name?: string
  email?: string
  docId?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'email' | 'docId' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de companies
export default interface ICompaniesRepository {
  // Operations básicas
  create(company: Company): Promise<IResult<Company>>
  findById(id: string): Promise<IResult<Company>>
  findByDocId(docId: string): Promise<IResult<Company>>
  findByEmail(email: string): Promise<IResult<Company>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: CompanyFilters): Promise<IPaginationResult<Company>>
  
  // Operations de atualização
  update(id: string, company: Partial<Company>): Promise<IResult<Company>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Company[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Company>>
  
  // Operations de verificação
  existsByDocId(docId: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>
  
  // Operation para contar total
  count(): Promise<number>
  countActive(): Promise<number>
}
