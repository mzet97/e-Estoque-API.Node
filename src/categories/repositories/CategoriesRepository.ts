import { Repository, Like, ILike } from 'typeorm'
import { injectable } from 'tsyringe'
import Category from '../entities/Category'
import ICategoriesRepository, { CategoryFilters } from './ICategoriesRepository'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { getDataSource } from '@shared/typeorm'

@injectable()
export class CategoriesRepository implements ICategoriesRepository {
  private repository: Repository<Category>

  constructor() {
    this.repository = getDataSource().getRepository(Category)
  }

  // Create operation
  async create(category: Category): Promise<IResult<Category>> {
    try {
      const savedCategory = await this.repository.save(category)
      
      return {
        success: true,
        data: savedCategory,
        message: 'Category created successfully'
      }
    } catch (error) {
      console.error('Error creating category:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create category'
      }
    }
  }

  // Find by ID
  async findById(id: string): Promise<IResult<Category>> {
    try {
      const category = await this.repository.findOne({
        where: { id },
        relations: ['parentCategory', 'subCategories']
      })

      if (!category) {
        return {
          success: false,
          data: null,
          message: 'Category not found'
        }
      }

      return {
        success: true,
        data: category,
        message: 'Category found successfully'
      }
    } catch (error) {
      console.error('Error finding category by ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find category'
      }
    }
  }

  // Find by slug
  async findBySlug(slug: string): Promise<IResult<Category>> {
    try {
      const category = await this.repository.findOne({
        where: { slug: ILike(slug) },
        relations: ['parentCategory', 'subCategories']
      })

      if (!category) {
        return {
          success: false,
          data: null,
          message: 'Category not found'
        }
      }

      return {
        success: true,
        data: category,
        message: 'Category found successfully'
      }
    } catch (error) {
      console.error('Error finding category by slug:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find category'
      }
    }
  }

  // Find by name
  async findByName(name: string): Promise<IResult<Category>> {
    try {
      const category = await this.repository.findOne({
        where: { name: ILike(name) }
      })

      if (!category) {
        return {
          success: false,
          data: null,
          message: 'Category not found'
        }
      }

      return {
        success: true,
        data: category,
        message: 'Category found successfully'
      }
    } catch (error) {
      console.error('Error finding category by name:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find category'
      }
    }
  }

  // Find root categories
  async findRootCategories(): Promise<IResult<Category[]>> {
    try {
      const categories = await this.repository.find({
        where: { parentCategoryId: null },
        order: { sortOrder: 'ASC', name: 'ASC' }
      })

      return {
        success: true,
        data: categories,
        message: 'Root categories retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding root categories:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve root categories'
      }
    }
  }

  // Find sub categories
  async findSubCategories(parentId: string): Promise<IResult<Category[]>> {
    try {
      const categories = await this.repository.find({
        where: { parentCategoryId: parentId },
        order: { sortOrder: 'ASC', name: 'ASC' }
      })

      return {
        success: true,
        data: categories,
        message: 'Sub categories retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding sub categories:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve sub categories'
      }
    }
  }

  // Find all with hierarchy
  async findAllWithHierarchy(): Promise<IResult<Category[]>> {
    try {
      const categories = await this.repository.find({
        relations: ['parentCategory', 'subCategories'],
        order: { parentCategory: { sortOrder: 'ASC' }, sortOrder: 'ASC', name: 'ASC' }
      })

      return {
        success: true,
        data: categories,
        message: 'Categories with hierarchy retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding categories with hierarchy:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve categories with hierarchy'
      }
    }
  }

  // Find category path
  async findCategoryPath(categoryId: string): Promise<string[]> {
    try {
      const path: string[] = []
      let currentCategory: Category | null = null
      let currentId = categoryId

      // Traverse up the hierarchy
      while (currentId) {
        const categoryResult = await this.repository.findOne({
          where: { id: currentId }
        })

        if (!categoryResult) {
          break
        }

        path.unshift(categoryResult.name)
        currentCategory = categoryResult
        currentId = categoryResult.parentCategoryId || ''
      }

      return path
    } catch (error) {
      console.error('Error finding category path:', error)
      return []
    }
  }

  // Find with filters and pagination
  async findWithFilters(filters: CategoryFilters): Promise<IPaginationResult<Category>> {
    try {
      const {
        name,
        description,
        isActive,
        hasParent,
        parentId,
        page = 1,
        pageSize = 20,
        orderBy = 'createdAt',
        orderDirection = 'DESC'
      } = filters

      const queryBuilder = this.repository.createQueryBuilder('category')
      
      // Apply filters
      if (name) {
        queryBuilder.andWhere('category.name ILIKE :name', { name: `%${name}%` })
      }
      
      if (description) {
        queryBuilder.andWhere('category.description ILIKE :description', { description: `%${description}%` })
      }
      
      if (isActive !== undefined) {
        queryBuilder.andWhere('category.isActive = :isActive', { isActive })
      }
      
      if (hasParent !== undefined) {
        if (hasParent) {
          queryBuilder.andWhere('category.parentCategoryId IS NOT NULL')
        } else {
          queryBuilder.andWhere('category.parentCategoryId IS NULL')
        }
      }
      
      if (parentId) {
        queryBuilder.andWhere('category.parentCategoryId = :parentId', { parentId })
      }

      // Apply ordering
      queryBuilder.orderBy(`category.${orderBy}`, orderDirection)

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
        message: 'Categories retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding categories with filters:', error)
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
        message: 'Failed to retrieve categories'
      }
    }
  }

  // Update operation
  async update(id: string, updateData: Partial<Category>): Promise<IResult<Category>> {
    try {
      const existingCategoryResult = await this.findById(id)
      
      if (!existingCategoryResult.success) {
        return existingCategoryResult
      }

      const updatedCategory = Object.assign(existingCategoryResult.data, {
        ...updateData,
        updatedAt: new Date()
      })

      const savedCategory = await this.repository.save(updatedCategory)

      return {
        success: true,
        data: savedCategory,
        message: 'Category updated successfully'
      }
    } catch (error) {
      console.error('Error updating category:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update category'
      }
    }
  }

  // Soft delete operation
  async delete(id: string): Promise<IResult<void>> {
    try {
      const existingCategoryResult = await this.findById(id)
      
      if (!existingCategoryResult.success) {
        return existingCategoryResult
      }

      // Check if can be deleted
      const canDelete = await this.canDelete(id)
      if (!canDelete) {
        return {
          success: false,
          data: null,
          message: 'Category cannot be deleted due to existing subcategories'
        }
      }

      existingCategoryResult.data.delete()
      await this.repository.save(existingCategoryResult.data)

      return {
        success: true,
        data: null,
        message: 'Category deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to delete category'
      }
    }
  }

  // Restore operation
  async restore(id: string): Promise<IResult<void>> {
    try {
      const existingCategoryResult = await this.findById(id)
      
      if (!existingCategoryResult.success) {
        return existingCategoryResult
      }

      existingCategoryResult.data.restore()
      await this.repository.save(existingCategoryResult.data)

      return {
        success: true,
        data: null,
        message: 'Category restored successfully'
      }
    } catch (error) {
      console.error('Error restoring category:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to restore category'
      }
    }
  }

  // Find all active categories
  async findAllActive(): Promise<IResult<Category[]>> {
    try {
      const categories = await this.repository.find({
        where: { isActive: true, isDeleted: false },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: categories,
        message: 'Active categories retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding active categories:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve active categories'
      }
    }
  }

  // Find all categories with pagination
  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<Category>> {
    const filters: CategoryFilters = {
      page,
      pageSize,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    }

    return this.findWithFilters(filters)
  }

  // Check if category exists by slug
  async existsBySlug(slug: string): Promise<boolean> {
    try {
      const result = await this.findBySlug(slug)
      return result.success
    } catch (error) {
      console.error('Error checking if category exists by slug:', error)
      return false
    }
  }

  // Check if category exists by name
  async existsByName(name: string): Promise<boolean> {
    try {
      const result = await this.findByName(name)
      return result.success
    } catch (error) {
      console.error('Error checking if category exists by name:', error)
      return false
    }
  }

  // Check if category can be deleted
  async canDelete(id: string): Promise<boolean> {
    try {
      const category = await this.repository.findOne({
        where: { id },
        relations: ['subCategories']
      })

      return !category || !category.subCategories || category.subCategories.length === 0
    } catch (error) {
      console.error('Error checking if category can be deleted:', error)
      return false
    }
  }

  // Move category to new parent
  async moveCategory(id: string, newParentId?: string): Promise<IResult<Category>> {
    try {
      // Avoid circular reference
      if (newParentId && newParentId === id) {
        return {
          success: false,
          data: null,
          message: 'Cannot move category to itself'
        }
      }

      // Check if new parent exists (if provided)
      if (newParentId) {
        const parentResult = await this.findById(newParentId)
        if (!parentResult.success) {
          return {
            success: false,
            data: null,
            message: 'New parent category not found'
          }
        }
      }

      const updateResult = await this.update(id, { parentCategoryId: newParentId })
      return updateResult
    } catch (error) {
      console.error('Error moving category:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to move category'
      }
    }
  }

  // Get category depth
  async getCategoryDepth(categoryId: string): Promise<number> {
    try {
      const path = await this.findCategoryPath(categoryId)
      return path.length - 1
    } catch (error) {
      console.error('Error getting category depth:', error)
      return 0
    }
  }

  // Count operations
  async count(): Promise<number> {
    try {
      return await this.repository.count()
    } catch (error) {
      console.error('Error counting categories:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isActive: true, isDeleted: false }
      })
    } catch (error) {
      console.error('Error counting active categories:', error)
      return 0
    }
  }

  async countByParent(parentId?: string): Promise<number> {
    try {
      const whereClause = parentId ? { parentCategoryId: parentId } : { parentCategoryId: null }
      return await this.repository.count({ where: whereClause })
    } catch (error) {
      console.error('Error counting categories by parent:', error)
      return 0
    }
  }
}
