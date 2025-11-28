import { Repository, Like, ILike } from 'typeorm'
import { injectable } from 'tsyringe'
import Product from '../entities/Product'
import IProductsRepository, { ProductFilters } from './IProductsRepository'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { getDataSource } from '@shared/typeorm'

@injectable()
export class ProductsRepository implements IProductsRepository {
  private repository: Repository<Product>

  constructor() {
    this.repository = getDataSource().getRepository(Product)
  }

  // Create operation
  async create(product: Product): Promise<IResult<Product>> {
    try {
      const savedProduct = await this.repository.save(product)
      
      return {
        success: true,
        data: savedProduct,
        message: 'Product created successfully'
      }
    } catch (error) {
      console.error('Error creating product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create product'
      }
    }
  }

  // Find by ID
  async findById(id: string): Promise<IResult<Product>> {
    try {
      const product = await this.repository.findOne({
        where: { id },
        relations: ['category', 'company']
      })

      if (!product) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      return {
        success: true,
        data: product,
        message: 'Product found successfully'
      }
    } catch (error) {
      console.error('Error finding product by ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find product'
      }
    }
  }

  // Find by SKU
  async findBySku(sku: string): Promise<IResult<Product>> {
    try {
      const product = await this.repository.findOne({
        where: { sku: ILike(sku) },
        relations: ['category', 'company']
      })

      if (!product) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      return {
        success: true,
        data: product,
        message: 'Product found successfully'
      }
    } catch (error) {
      console.error('Error finding product by SKU:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find product'
      }
    }
  }

  // Find by barcode
  async findByBarcode(barcode: string): Promise<IResult<Product>> {
    try {
      const product = await this.repository.findOne({
        where: { barcode: ILike(barcode) },
        relations: ['category', 'company']
      })

      if (!product) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      return {
        success: true,
        data: product,
        message: 'Product found successfully'
      }
    } catch (error) {
      console.error('Error finding product by barcode:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find product'
      }
    }
  }

  // Find with filters and pagination
  async findWithFilters(filters: ProductFilters): Promise<IPaginationResult<Product>> {
    try {
      const {
        name,
        description,
        sku,
        barcode,
        minPrice,
        maxPrice,
        inStock,
        lowStock,
        outOfStock,
        isActive,
        isFeatured,
        categoryId,
        companyId,
        hasImages,
        page = 1,
        pageSize = 20,
        orderBy = 'createdAt',
        orderDirection = 'DESC',
        searchTerm
      } = filters

      const queryBuilder = this.repository.createQueryBuilder('product')
      
      // Apply filters
      if (name) {
        queryBuilder.andWhere('product.name ILIKE :name', { name: `%${name}%` })
      }
      
      if (description) {
        queryBuilder.andWhere('product.description ILIKE :description', { description: `%${description}%` })
      }
      
      if (sku) {
        queryBuilder.andWhere('product.sku ILIKE :sku', { sku: `%${sku}%` })
      }
      
      if (barcode) {
        queryBuilder.andWhere('product.barcode ILIKE :barcode', { barcode: `%${barcode}%` })
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice })
      }
      
      if (maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice })
      }
      
      if (isActive !== undefined) {
        queryBuilder.andWhere('product.isActive = :isActive', { isActive })
      }
      
      if (isFeatured !== undefined) {
        queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured })
      }

      if (categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId })
      }

      if (companyId) {
        queryBuilder.andWhere('product.companyId = :companyId', { companyId })
      }

      if (searchTerm) {
        queryBuilder.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search OR product.shortDescription ILIKE :search)',
          { search: `%${searchTerm}%` }
        )
      }

      // Stock filters
      if (inStock) {
        queryBuilder.andWhere('product.availableQuantity > 0')
      } else if (lowStock) {
        queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel AND product.stockQuantity > 0')
      } else if (outOfStock) {
        queryBuilder.andWhere('product.stockQuantity <= 0')
      }

      // Apply ordering
      queryBuilder.orderBy(`product.${orderBy}`, orderDirection)

      // Get total count for pagination
      const totalItems = await queryBuilder.getCount()

      // Apply pagination
      const offset = (page - 1) * pageSize
      queryBuilder.skip(offset).take(pageSize)

      // Execute query
      const items = await queryBuilder.getMany()

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        data: {
          items,
          pagination: {
            currentPage: page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        message: 'Products retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding products with filters:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: filters.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Failed to retrieve products'
      }
    }
  }

  // Find featured products
  async findFeatured(limit: number = 10): Promise<IResult<Product[]>> {
    try {
      const products = await this.repository.find({
        where: { isFeatured: true, isActive: true, isDeleted: false },
        order: { createdAt: 'DESC' },
        take: limit
      })

      return {
        success: true,
        data: products,
        message: 'Featured products retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding featured products:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve featured products'
      }
    }
  }

  // Find low stock products
  async findLowStock(limit: number = 20): Promise<IResult<Product[]>> {
    try {
      const products = await this.repository
        .createQueryBuilder('product')
        .where('product.stockQuantity <= product.minStockLevel')
        .andWhere('product.stockQuantity > 0')
        .andWhere('product.isActive = true')
        .andWhere('product.isDeleted = false')
        .orderBy('product.stockQuantity', 'ASC')
        .take(limit)
        .getMany()

      return {
        success: true,
        data: products,
        message: 'Low stock products retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding low stock products:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve low stock products'
      }
    }
  }

  // Find by category
  async findByCategory(categoryId: string, includeSubCategories: boolean = false): Promise<IResult<Product[]>> {
    try {
      let queryBuilder = this.repository
        .createQueryBuilder('product')
        .where('product.categoryId = :categoryId', { categoryId })
        .andWhere('product.isActive = true')
        .andWhere('product.isDeleted = false')

      // Note: In a full implementation, this would handle subcategories
      // For now, it just filters by the specific category

      const products = await queryBuilder
        .orderBy('product.name', 'ASC')
        .getMany()

      return {
        success: true,
        data: products,
        message: 'Products by category retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding products by category:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve products by category'
      }
    }
  }

  // Find by company
  async findByCompany(companyId: string): Promise<IResult<Product[]>> {
    try {
      const products = await this.repository.find({
        where: { companyId, isActive: true, isDeleted: false },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: products,
        message: 'Products by company retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding products by company:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve products by company'
      }
    }
  }

  // Search products
  async searchProducts(searchTerm: string, filters?: Partial<ProductFilters>): Promise<IPaginationResult<Product>> {
    try {
      const searchFilters: ProductFilters = {
        searchTerm,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
        ...filters
      }

      return this.findWithFilters(searchFilters)
    } catch (error) {
      console.error('Error searching products:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: filters?.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Failed to search products'
      }
    }
  }

  // Update operation
  async update(id: string, updateData: Partial<Product>): Promise<IResult<Product>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      const updatedProduct = Object.assign(existingProductResult.data, {
        ...updateData,
        updatedAt: new Date()
      })

      const savedProduct = await this.repository.save(updatedProduct)

      return {
        success: true,
        data: savedProduct,
        message: 'Product updated successfully'
      }
    } catch (error) {
      console.error('Error updating product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update product'
      }
    }
  }

  // Stock management operations
  async updateStock(id: string, newQuantity: number): Promise<IResult<Product>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      const product = existingProductResult.data
      product.stockQuantity = newQuantity
      product.availableQuantity = Math.max(0, newQuantity - product.reservedQuantity)
      product.updatedAt = new Date()

      const savedProduct = await this.repository.save(product)

      return {
        success: true,
        data: savedProduct,
        message: 'Stock updated successfully'
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update stock'
      }
    }
  }

  // Reserve stock
  async reserveStock(id: string, quantity: number): Promise<IResult<Product>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      const product = existingProductResult.data
      
      if (product.availableQuantity >= quantity) {
        product.reservedQuantity += quantity
        product.availableQuantity -= quantity
        product.updatedAt = new Date()

        const savedProduct = await this.repository.save(product)

        return {
          success: true,
          data: savedProduct,
          message: 'Stock reserved successfully'
        }
      } else {
        return {
          success: false,
          data: null,
          message: 'Insufficient stock available'
        }
      }
    } catch (error) {
      console.error('Error reserving stock:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to reserve stock'
      }
    }
  }

  // Release stock
  async releaseStock(id: string, quantity: number): Promise<IResult<Product>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      const product = existingProductResult.data
      product.reservedQuantity = Math.max(0, product.reservedQuantity - quantity)
      product.availableQuantity = Math.min(product.stockQuantity, product.availableQuantity + quantity)
      product.updatedAt = new Date()

      const savedProduct = await this.repository.save(product)

      return {
        success: true,
        data: savedProduct,
        message: 'Stock released successfully'
      }
    } catch (error) {
      console.error('Error releasing stock:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to release stock'
      }
    }
  }

  // Soft delete operation
  async delete(id: string): Promise<IResult<void>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      existingProductResult.data.delete()
      await this.repository.save(existingProductResult.data)

      return {
        success: true,
        data: null,
        message: 'Product deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to delete product'
      }
    }
  }

  // Restore operation
  async restore(id: string): Promise<IResult<void>> {
    try {
      const existingProductResult = await this.findById(id)
      
      if (!existingProductResult.success) {
        return existingProductResult
      }

      existingProductResult.data.restore()
      await this.repository.save(existingProductResult.data)

      return {
        success: true,
        data: null,
        message: 'Product restored successfully'
      }
    } catch (error) {
      console.error('Error restoring product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to restore product'
      }
    }
  }

  // Find all active products
  async findAllActive(): Promise<IResult<Product[]>> {
    try {
      const products = await this.repository.find({
        where: { isActive: true, isDeleted: false },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: products,
        message: 'Active products retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding active products:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve active products'
      }
    }
  }

  // Find all products with pagination
  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<Product>> {
    const filters: ProductFilters = {
      page,
      pageSize,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    }

    return this.findWithFilters(filters)
  }

  // Check operations
  async existsBySku(sku: string): Promise<boolean> {
    try {
      const result = await this.findBySku(sku)
      return result.success
    } catch (error) {
      console.error('Error checking if product exists by SKU:', error)
      return false
    }
  }

  async existsByBarcode(barcode: string): Promise<boolean> {
    try {
      const result = await this.findByBarcode(barcode)
      return result.success
    } catch (error) {
      console.error('Error checking if product exists by barcode:', error)
      return false
    }
  }

  // Statistics
  async getStatistics(companyId?: string): Promise<{
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    averagePrice: number
    totalStockValue: number
  }> {
    try {
      let queryBuilder = this.repository
        .createQueryBuilder('product')
        .select([
          'COUNT(*) as totalProducts',
          'SUM(CASE WHEN product.isActive = true AND product.isDeleted = false THEN 1 ELSE 0 END) as activeProducts',
          'SUM(CASE WHEN product.stockQuantity <= product.minStockLevel AND product.stockQuantity > 0 THEN 1 ELSE 0 END) as lowStockProducts',
          'SUM(CASE WHEN product.stockQuantity <= 0 THEN 1 ELSE 0 END) as outOfStockProducts',
          'AVG(product.price) as averagePrice',
          'SUM(product.stockQuantity * product.price) as totalStockValue'
        ])

      if (companyId) {
        queryBuilder = queryBuilder.where('product.companyId = :companyId', { companyId })
      }

      const result = await queryBuilder.getRawOne()

      return {
        totalProducts: parseInt(result?.totalProducts || '0'),
        activeProducts: parseInt(result?.activeProducts || '0'),
        lowStockProducts: parseInt(result?.lowStockProducts || '0'),
        outOfStockProducts: parseInt(result?.outOfStockProducts || '0'),
        averagePrice: parseFloat(result?.averagePrice || '0'),
        totalStockValue: parseFloat(result?.totalStockValue || '0')
      }
    } catch (error) {
      console.error('Error getting product statistics:', error)
      return {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        averagePrice: 0,
        totalStockValue: 0
      }
    }
  }

  // Count operations
  async count(): Promise<number> {
    try {
      return await this.repository.count()
    } catch (error) {
      console.error('Error counting products:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isActive: true, isDeleted: false }
      })
    } catch (error) {
      console.error('Error counting active products:', error)
      return 0
    }
  }

  async countByCategory(categoryId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { categoryId, isActive: true, isDeleted: false }
      })
    } catch (error) {
      console.error('Error counting products by category:', error)
      return 0
    }
  }

  async countLowStock(): Promise<number> {
    try {
      return await this.repository
        .createQueryBuilder('product')
        .where('product.stockQuantity <= product.minStockLevel')
        .andWhere('product.stockQuantity > 0')
        .getCount()
    } catch (error) {
      console.error('Error counting low stock products:', error)
      return 0
    }
  }

  // Simplified implementations for remaining methods
  async findSimilarProducts(productId: string, limit: number = 5): Promise<IResult<Product[]>> {
    // Simplified implementation
    return {
      success: true,
      data: [],
      message: 'Similar products retrieval not implemented yet'
    }
  }

  async getTopSellingProducts(limit: number = 10, days?: number): Promise<IResult<Product[]>> {
    // Simplified implementation
    return {
      success: true,
      data: [],
      message: 'Top selling products retrieval not implemented yet'
    }
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<IResult<Product[]>> {
    try {
      const products = await this.repository.find({
        where: [
          { price: minPrice, isActive: true, isDeleted: false },
        ],
        order: { price: 'ASC' }
      })

      return {
        success: true,
        data: products,
        message: 'Products by price range retrieved successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve products by price range'
      }
    }
  }

  async getProductsByCategoryStats(): Promise<Array<{
    categoryId: string
    categoryName: string
    productCount: number
    averagePrice: number
  }>> {
    // Simplified implementation
    return []
  }

  async bulkUpdatePrices(updates: Array<{ id: string; price: number }>): Promise<IResult<void>> {
    // Simplified implementation
    return {
      success: true,
      data: null,
      message: 'Bulk price update not implemented yet'
    }
  }

  async bulkUpdateStock(updates: Array<{ id: string; stockQuantity: number }>): Promise<IResult<void>> {
    // Simplified implementation
    return {
      success: true,
      data: null,
      message: 'Bulk stock update not implemented yet'
    }
  }

  async bulkActivate(ids: string[]): Promise<IResult<void>> {
    // Simplified implementation
    return {
      success: true,
      data: null,
      message: 'Bulk activate not implemented yet'
    }
  }

  async bulkDeactivate(ids: string[]): Promise<IResult<void>> {
    // Simplified implementation
    return {
      success: true,
      data: null,
      message: 'Bulk deactivate not implemented yet'
    }
  }

  async findByCategories(categoryIds: string[]): Promise<IResult<Product[]>> {
    // Simplified implementation
    return {
      success: true,
      data: [],
      message: 'Find by categories not implemented yet'
    }
  }
}
