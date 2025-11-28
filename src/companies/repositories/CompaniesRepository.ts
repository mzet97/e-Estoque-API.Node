import { Repository, Like, ILike } from 'typeorm'
import { injectable } from 'tsyringe'
import Company from '../entities/Company'
import ICompaniesRepository, { CompanyFilters } from './ICompaniesRepository'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { getDataSource } from '@shared/typeorm'

@injectable()
export class CompaniesRepository implements ICompaniesRepository {
  private repository: Repository<Company>

  constructor() {
    this.repository = getDataSource().getRepository(Company)
  }

  // Create operation
  async create(company: Company): Promise<IResult<Company>> {
    try {
      const savedCompany = await this.repository.save(company)
      
      return {
        success: true,
        data: savedCompany,
        message: 'Company created successfully'
      }
    } catch (error) {
      console.error('Error creating company:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create company'
      }
    }
  }

  // Find by ID
  async findById(id: string): Promise<IResult<Company>> {
    try {
      const company = await this.repository.findOne({
        where: { id },
        relations: []
      })

      if (!company) {
        return {
          success: false,
          data: null,
          message: 'Company not found'
        }
      }

      return {
        success: true,
        data: company,
        message: 'Company found successfully'
      }
    } catch (error) {
      console.error('Error finding company by ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find company'
      }
    }
  }

  // Find by document ID
  async findByDocId(docId: string): Promise<IResult<Company>> {
    try {
      const cleanDocId = docId.replace(/\D/g, '') // Remove non-digits
      
      const company = await this.repository
        .createQueryBuilder('company')
        .where('REPLACE(company.docId, \'.\', \'\') = :docId', { docId: cleanDocId })
        .orWhere('company.docId = :docId', { docId: docId })
        .getOne()

      if (!company) {
        return {
          success: false,
          data: null,
          message: 'Company not found'
        }
      }

      return {
        success: true,
        data: company,
        message: 'Company found successfully'
      }
    } catch (error) {
      console.error('Error finding company by document ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find company'
      }
    }
  }

  // Find by email
  async findByEmail(email: string): Promise<IResult<Company>> {
    try {
      const company = await this.repository.findOne({
        where: { email: ILike(email) } // Case insensitive
      })

      if (!company) {
        return {
          success: false,
          data: null,
          message: 'Company not found'
        }
      }

      return {
        success: true,
        data: company,
        message: 'Company found successfully'
      }
    } catch (error) {
      console.error('Error finding company by email:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find company'
      }
    }
  }

  // Find with filters and pagination
  async findWithFilters(filters: CompanyFilters): Promise<IPaginationResult<Company>> {
    try {
      const {
        name,
        email,
        docId,
        isActive,
        page = 1,
        pageSize = 20,
        orderBy = 'createdAt',
        orderDirection = 'DESC'
      } = filters

      const queryBuilder = this.repository.createQueryBuilder('company')
      
      // Apply filters
      if (name) {
        queryBuilder.andWhere('company.name ILIKE :name', { name: `%${name}%` })
      }
      
      if (email) {
        queryBuilder.andWhere('company.email ILIKE :email', { email: `%${email}%` })
      }
      
      if (docId) {
        const cleanDocId = docId.replace(/\D/g, '')
        queryBuilder.andWhere(
          'REPLACE(REPLACE(REPLACE(company.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') ILIKE :docId',
          { docId: `%${cleanDocId}%` }
        )
      }
      
      if (isActive !== undefined) {
        queryBuilder.andWhere('company.isDeleted = :isActive', { isActive: !isActive })
      }

      // Apply ordering
      queryBuilder.orderBy(`company.${orderBy}`, orderDirection)

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
        message: 'Companies retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding companies with filters:', error)
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
        message: 'Failed to retrieve companies'
      }
    }
  }

  // Update operation
  async update(id: string, updateData: Partial<Company>): Promise<IResult<Company>> {
    try {
      const existingCompanyResult = await this.findById(id)
      
      if (!existingCompanyResult.success) {
        return existingCompanyResult
      }

      const updatedCompany = Object.assign(existingCompanyResult.data, {
        ...updateData,
        updatedAt: new Date()
      })

      const savedCompany = await this.repository.save(updatedCompany)

      return {
        success: true,
        data: savedCompany,
        message: 'Company updated successfully'
      }
    } catch (error) {
      console.error('Error updating company:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update company'
      }
    }
  }

  // Soft delete operation
  async delete(id: string): Promise<IResult<void>> {
    try {
      const existingCompanyResult = await this.findById(id)
      
      if (!existingCompanyResult.success) {
        return existingCompanyResult
      }

      existingCompanyResult.data.delete()
      await this.repository.save(existingCompanyResult.data)

      return {
        success: true,
        data: null,
        message: 'Company deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to delete company'
      }
    }
  }

  // Restore operation (undo soft delete)
  async restore(id: string): Promise<IResult<void>> {
    try {
      const existingCompanyResult = await this.findById(id)
      
      if (!existingCompanyResult.success) {
        return existingCompanyResult
      }

      existingCompanyResult.data.restore()
      await this.repository.save(existingCompanyResult.data)

      return {
        success: true,
        data: null,
        message: 'Company restored successfully'
      }
    } catch (error) {
      console.error('Error restoring company:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to restore company'
      }
    }
  }

  // Find all active companies
  async findAllActive(): Promise<IResult<Company[]>> {
    try {
      const companies = await this.repository.find({
        where: { isDeleted: false },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: companies,
        message: 'Active companies retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding active companies:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve active companies'
      }
    }
  }

  // Find all companies with pagination
  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<Company>> {
    const filters: CompanyFilters = {
      page,
      pageSize,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    }

    return this.findWithFilters(filters)
  }

  // Check if company exists by document ID
  async existsByDocId(docId: string): Promise<boolean> {
    try {
      const result = await this.findByDocId(docId)
      return result.success
    } catch (error) {
      console.error('Error checking if company exists by document ID:', error)
      return false
    }
  }

  // Check if company exists by email
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const result = await this.findByEmail(email)
      return result.success
    } catch (error) {
      console.error('Error checking if company exists by email:', error)
      return false
    }
  }

  // Count total companies
  async count(): Promise<number> {
    try {
      return await this.repository.count()
    } catch (error) {
      console.error('Error counting companies:', error)
      return 0
    }
  }

  // Count active companies
  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('Error counting active companies:', error)
      return 0
    }
  }
}
