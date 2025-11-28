import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Product from '../entities/Product'

// Interface para filtros avançados de busca de products
export interface ProductFilters {
  // Filtros básicos
  name?: string
  description?: string
  shortDescription?: string
  sku?: string
  barcode?: string
  
  // Filtros de preço
  minPrice?: number
  maxPrice?: number
  
  // Filtros de estoque
  inStock?: boolean
  lowStock?: boolean
  outOfStock?: boolean
  
  // Filtros de status
  isActive?: boolean
  isFeatured?: boolean
  isDigital?: boolean
  
  // Filtros de relacionamentos
  categoryId?: string
  companyId?: string
  
  // Filtros avançados
  hasImages?: boolean
  hasDimensions?: boolean
  hasWeight?: boolean
  
  // Filtros de data
  createdAfter?: Date
  createdBefore?: Date
  
  // Paginação e ordenação
  page?: number
  pageSize?: number
  orderBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'stockQuantity' | 'salesCount'
  orderDirection?: 'ASC' | 'DESC'
  
  // Busca de texto livre
  searchTerm?: string
  
  // Filtros de categoria (incluindo subcategorias)
  categoryIds?: string[]
  excludeCategoryIds?: string[]
  
  // Filtros de preço com margem
  profitMarginMin?: number
  profitMarginMax?: number
  
  // Filtros de dimensões
  minWeight?: number
  maxWeight?: number
  minVolume?: number
  maxVolume?: number
}

// Interface para o repository de products
export default interface IProductsRepository {
  // Operations básicas
  create(product: Product): Promise<IResult<Product>>
  findById(id: string): Promise<IResult<Product>>
  findBySku(sku: string): Promise<IResult<Product>>
  findByBarcode(barcode: string): Promise<IResult<Product>>
  
  // Operations de listagem com filtros avançados
  findWithFilters(filters: ProductFilters): Promise<IPaginationResult<Product>>
  findFeatured(limit?: number): Promise<IResult<Product[]>>
  findLowStock(limit?: number): Promise<IResult<Product[]>>
  
  // Operations por categoria
  findByCategory(categoryId: string, includeSubCategories?: boolean): Promise<IResult<Product[]>>
  findByCategories(categoryIds: string[]): Promise<IResult<Product[]>>
  
  // Operations por empresa
  findByCompany(companyId: string): Promise<IResult<Product[]>>
  
  // Operations de busca avançada
  searchProducts(searchTerm: string, filters?: Partial<ProductFilters>): Promise<IPaginationResult<Product>>
  findSimilarProducts(productId: string, limit?: number): Promise<IResult<Product[]>>
  
  // Operations de atualização
  update(id: string, product: Partial<Product>): Promise<IResult<Product>>
  
  // Operations de estoque
  updateStock(id: string, newQuantity: number): Promise<IResult<Product>>
  reserveStock(id: string, quantity: number): Promise<IResult<Product>>
  releaseStock(id: string, quantity: number): Promise<IResult<Product>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Product[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Product>>
  
  // Operations de verificação
  existsBySku(sku: string): Promise<boolean>
  existsByBarcode(barcode: string): Promise<boolean>
  
  // Operations estatísticas
  getStatistics(companyId?: string): Promise<{
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    averagePrice: number
    totalStockValue: number
  }>
  
  // Operations de agregação
  getTopSellingProducts(limit?: number, days?: number): Promise<IResult<Product[]>>
  getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<IResult<Product[]>>
  getProductsByCategoryStats(): Promise<Array<{
    categoryId: string
    categoryName: string
    productCount: number
    averagePrice: number
  }>>
  
  // Operations de contagem
  count(): Promise<number>
  countActive(): Promise<number>
  countByCategory(categoryId: string): Promise<number>
  countLowStock(): Promise<number>
  
  // Operations de bulk
  bulkUpdatePrices(updates: Array<{ id: string; price: number }>): Promise<IResult<void>>
  bulkUpdateStock(updates: Array<{ id: string; stockQuantity: number }>): Promise<IResult<void>>
  bulkActivate(ids: string[]): Promise<IResult<void>>
  bulkDeactivate(ids: string[]): Promise<IResult<void>>
}
