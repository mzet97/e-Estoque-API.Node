import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Tax from '../entities/Tax'

// Interface para filtros de busca de taxes
export interface TaxFilters {
  name?: string
  idCategory?: string
  percentage?: number
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'percentage' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de taxes
export default interface ITaxesRepository {
  // Operations básicas
  create(tax: Tax): Promise<IResult<Tax>>
  findById(id: string): Promise<IResult<Tax>>
  findByName(name: string): Promise<IResult<Tax>>
  findByCategory(categoryId: string): Promise<IResult<Tax[]>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: TaxFilters): Promise<IPaginationResult<Tax>>
  
  // Operations de atualização
  update(id: string, tax: Partial<Tax>): Promise<IResult<Tax>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Tax[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Tax>>
  
  // Operations de verificação
  existsByName(name: string): Promise<boolean>
  existsByNameAndCategory(name: string, categoryId: string, excludeId?: string): Promise<boolean>
  getTaxesByPercentageRange(minPercentage: number, maxPercentage: number): Promise<IResult<Tax[]>>
  
  // Operation para contar total
  count(): Promise<number>
  countActive(): Promise<number>
  countByCategory(categoryId: string): Promise<number>
}