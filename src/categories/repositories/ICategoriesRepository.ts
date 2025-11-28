import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Category from '../entities/Category'

// Interface para filtros de busca de categories
export interface CategoryFilters {
  name?: string
  description?: string
  isActive?: boolean
  hasParent?: boolean
  parentId?: string
  depth?: number
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'description' | 'sortOrder' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
}

// Interface para o repository de categories
export default interface ICategoriesRepository {
  // Operations básicas
  create(category: Category): Promise<IResult<Category>>
  findById(id: string): Promise<IResult<Category>>
  findBySlug(slug: string): Promise<IResult<Category>>
  findByName(name: string): Promise<IResult<Category>>
  
  // Operations de hierarquia
  findRootCategories(): Promise<IResult<Category[]>>
  findSubCategories(parentId: string): Promise<IResult<Category[]>>
  findAllWithHierarchy(): Promise<IResult<Category[]>>
  findCategoryPath(categoryId: string): Promise<string[]>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: CategoryFilters): Promise<IPaginationResult<Category>>
  
  // Operations de atualização
  update(id: string, category: Partial<Category>): Promise<IResult<Category>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Category[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Category>>
  
  // Operations de verificação
  existsBySlug(slug: string): Promise<boolean>
  existsByName(name: string): Promise<boolean>
  isAncestor(categoryId: string, potentialAncestorId: string): Promise<boolean>
  isDescendant(categoryId: string, potentialDescendantId: string): Promise<boolean>
  
  // Operations específicas da hierarquia
  canDelete(id: string): Promise<boolean>
  moveCategory(id: string, newParentId?: string): Promise<IResult<Category>>
  getCategoryDepth(categoryId: string): Promise<number>
  
  // Operation para contar total
  count(): Promise<number>
  countActive(): Promise<number>
  countByParent(parentId?: string): Promise<number>
}
