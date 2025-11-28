import { Repository, Like, ILike } from 'typeorm'
import { injectable } from 'tsyringe'
import Customer from '../entities/Customer'
import ICustomersRepository, { CustomerFilters } from './ICustomersRepository'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { dataSource } from '@shared/typeorm'
import { DocumentValidationService } from '@shared/services/DocumentValidationService'

@injectable()
export class CustomersRepository implements ICustomersRepository {
  private repository: Repository<Customer>

  constructor() {
    this.repository = dataSource.getRepository(Customer)
  }

  // Create operation
  async create(customer: Customer): Promise<IResult<Customer>> {
    try {
      const savedCustomer = await this.repository.save(customer)
      
      return {
        success: true,
        data: savedCustomer,
        message: 'Customer created successfully'
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create customer'
      }
    }
  }

  // Find by ID
  async findById(id: string): Promise<IResult<Customer>> {
    try {
      const customer = await this.repository.findOne({
        where: { id },
        relations: []
      })

      if (!customer) {
        return {
          success: false,
          data: null,
          message: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer,
        message: 'Customer found successfully'
      }
    } catch (error) {
      console.error('Error finding customer by ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find customer'
      }
    }
  }

  // Find by document ID
  async findByDocId(docId: string): Promise<IResult<Customer>> {
    try {
      const cleanDocId = DocumentValidationService.cleanDocument(docId)
      
      const customer = await this.repository
        .createQueryBuilder('customer')
        .where('REPLACE(REPLACE(REPLACE(customer.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = :docId', { docId: cleanDocId })
        .orWhere('customer.docId = :docId', { docId: docId })
        .getOne()

      if (!customer) {
        return {
          success: false,
          data: null,
          message: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer,
        message: 'Customer found successfully'
      }
    } catch (error) {
      console.error('Error finding customer by document ID:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find customer'
      }
    }
  }

  // Find by email
  async findByEmail(email: string): Promise<IResult<Customer>> {
    try {
      const customer = await this.repository.findOne({
        where: { email: ILike(email) } // Case insensitive
      })

      if (!customer) {
        return {
          success: false,
          data: null,
          message: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer,
        message: 'Customer found successfully'
      }
    } catch (error) {
      console.error('Error finding customer by email:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to find customer'
      }
    }
  }

  // Find with filters and pagination
  async findWithFilters(filters: CustomerFilters): Promise<IPaginationResult<Customer>> {
    try {
      const {
        name,
        email,
        docId,
        phoneNumber,
        personType,
        hasAddress,
        isActive,
        search,
        page = 1,
        pageSize = 20,
        orderBy = 'createdAt',
        orderDirection = 'DESC'
      } = filters

      const queryBuilder = this.repository.createQueryBuilder('customer')
      
      // Apply text search across multiple fields
      if (search) {
        queryBuilder.andWhere(
          '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.docId ILIKE :search OR customer.phoneNumber ILIKE :search OR customer.shortDescription ILIKE :search)',
          { search: `%${search}%` }
        )
      }
      
      // Apply filters
      if (name) {
        queryBuilder.andWhere('customer.name ILIKE :name', { name: `%${name}%` })
      }
      
      if (email) {
        queryBuilder.andWhere('customer.email ILIKE :email', { email: `%${email}%` })
      }
      
      if (docId) {
        const cleanDocId = DocumentValidationService.cleanDocument(docId)
        queryBuilder.andWhere(
          'REPLACE(REPLACE(REPLACE(customer.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') ILIKE :docId',
          { docId: `%${cleanDocId}%` }
        )
      }

      if (phoneNumber) {
        const cleanPhone = phoneNumber.replace(/\D/g, '')
        queryBuilder.andWhere(
          'REPLACE(customer.phoneNumber, \'(\', \'\') ILIKE :phone OR REPLACE(REPLACE(customer.phoneNumber, \'(\', \'\'), \')\', \'\') ILIKE :phone OR REPLACE(REPLACE(REPLACE(customer.phoneNumber, \'(\', \'\'), \')\', \'\'), \'-\', \'\') ILIKE :phone',
          { phone: `%${cleanPhone}%` }
        )
      }
      
      if (personType) {
        queryBuilder.andWhere('LENGTH(REPLACE(REPLACE(REPLACE(customer.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\')) = :docLength', { 
          docLength: personType === 'FISICA' ? 11 : 14
        })
      }
      
      if (hasAddress !== undefined) {
        if (hasAddress) {
          queryBuilder.andWhere('customer.customer_address IS NOT NULL')
        } else {
          queryBuilder.andWhere('customer.customer_address IS NULL')
        }
      }
      
      if (isActive !== undefined) {
        queryBuilder.andWhere('customer.isDeleted = :isActive', { isActive: !isActive })
      }

      // Apply ordering
      queryBuilder.orderBy(`customer.${orderBy}`, orderDirection)

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
        message: 'Customers retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding customers with filters:', error)
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
        message: 'Failed to retrieve customers'
      }
    }
  }

  // Update operation
  async update(id: string, updateData: Partial<Customer>): Promise<IResult<Customer>> {
    try {
      const existingCustomerResult = await this.findById(id)
      
      if (!existingCustomerResult.success) {
        return existingCustomerResult
      }

      const updatedCustomer = Object.assign(existingCustomerResult.data, {
        ...updateData,
        updatedAt: new Date()
      })

      const savedCustomer = await this.repository.save(updatedCustomer)

      return {
        success: true,
        data: savedCustomer,
        message: 'Customer updated successfully'
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update customer'
      }
    }
  }

  // Soft delete operation
  async delete(id: string): Promise<IResult<void>> {
    try {
      const existingCustomerResult = await this.findById(id)
      
      if (!existingCustomerResult.success) {
        return existingCustomerResult
      }

      existingCustomerResult.data.delete()
      await this.repository.save(existingCustomerResult.data)

      return {
        success: true,
        data: null,
        message: 'Customer deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to delete customer'
      }
    }
  }

  // Restore operation (undo soft delete)
  async restore(id: string): Promise<IResult<void>> {
    try {
      const existingCustomerResult = await this.findById(id)
      
      if (!existingCustomerResult.success) {
        return existingCustomerResult
      }

      existingCustomerResult.data.restore()
      await this.repository.save(existingCustomerResult.data)

      return {
        success: true,
        data: null,
        message: 'Customer restored successfully'
      }
    } catch (error) {
      console.error('Error restoring customer:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to restore customer'
      }
    }
  }

  // Find all active customers
  async findAllActive(): Promise<IResult<Customer[]>> {
    try {
      const customers = await this.repository.find({
        where: { isDeleted: false },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: customers,
        message: 'Active customers retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding active customers:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve active customers'
      }
    }
  }

  // Find all customers with pagination
  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<Customer>> {
    const filters: CustomerFilters = {
      page,
      pageSize,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    }

    return this.findWithFilters(filters)
  }

  // Check if customer exists by document ID
  async existsByDocId(docId: string): Promise<boolean> {
    try {
      const result = await this.findByDocId(docId)
      return result.success
    } catch (error) {
      console.error('Error checking if customer exists by document ID:', error)
      return false
    }
  }

  // Check if customer exists by email
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const result = await this.findByEmail(email)
      return result.success
    } catch (error) {
      console.error('Error checking if customer exists by email:', error)
      return false
    }
  }

  // Find customers by person type
  async findByPersonType(personType: 'FISICA' | 'JURIDICA'): Promise<IResult<Customer[]>> {
    try {
      const customers = await this.repository
        .createQueryBuilder('customer')
        .where('customer.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('LENGTH(REPLACE(REPLACE(REPLACE(customer.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\')) = :docLength', { 
          docLength: personType === 'FISICA' ? 11 : 14
        })
        .orderBy('customer.name', 'ASC')
        .getMany()

      return {
        success: true,
        data: customers,
        message: `${personType} customers retrieved successfully`
      }
    } catch (error) {
      console.error(`Error finding ${personType} customers:`, error)
      return {
        success: false,
        data: [],
        message: `Failed to retrieve ${personType} customers`
      }
    }
  }

  // Find customers with address
  async findWithAddress(): Promise<IResult<Customer[]>> {
    try {
      const customers = await this.repository.find({
        where: { 
          isDeleted: false,
          customerAddress: () => 'customer_address IS NOT NULL' as any
        },
        order: { name: 'ASC' }
      })

      return {
        success: true,
        data: customers,
        message: 'Customers with address retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding customers with address:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve customers with address'
      }
    }
  }

  // Find customers without address
  async findWithoutAddress(): Promise<IResult<Customer[]>> {
    try {
      const customers = await this.repository.find({
        where: { isDeleted: false },
        order: { name: 'ASC' }
      })

      const customersWithoutAddress = customers.filter(customer => !customer.customerAddress)

      return {
        success: true,
        data: customersWithoutAddress,
        message: 'Customers without address retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding customers without address:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve customers without address'
      }
    }
  }

  // Search customers by text
  async searchCustomers(searchTerm: string): Promise<IResult<Customer[]>> {
    try {
      const filters: CustomerFilters = {
        search: searchTerm,
        isActive: true
      }

      const result = await this.findWithFilters(filters)
      return {
        success: result.success,
        data: result.success ? result.data.items : [],
        message: result.success ? result.message : 'Search failed'
      }
    } catch (error) {
      console.error('Error searching customers:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to search customers'
      }
    }
  }

  // Find customer with details
  async findWithDetails(id: string): Promise<IResult<Customer>> {
    try {
      const customer = await this.repository.findOne({
        where: { id },
        relations: []
      })

      if (!customer) {
        return {
          success: false,
          data: null,
          message: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer,
        message: 'Customer with details retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding customer with details:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve customer with details'
      }
    }
  }

  // Count total customers
  async count(): Promise<number> {
    try {
      return await this.repository.count()
    } catch (error) {
      console.error('Error counting customers:', error)
      return 0
    }
  }

  // Count active customers
  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('Error counting active customers:', error)
      return 0
    }
  }

  // Count customers by person type
  async countByPersonType(personType: 'FISICA' | 'JURIDICA'): Promise<number> {
    try {
      const result = await this.repository
        .createQueryBuilder('customer')
        .where('customer.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('LENGTH(REPLACE(REPLACE(REPLACE(customer.docId, \'.\', \'\'), \'/\', \'\'), \'-\', \'\')) = :docLength', { 
          docLength: personType === 'FISICA' ? 11 : 14
        })
        .getCount()

      return result
    } catch (error) {
      console.error(`Error counting ${personType} customers:`, error)
      return 0
    }
  }

  // Count customers with address
  async countWithAddress(): Promise<number> {
    try {
      const customers = await this.repository.find({
        where: { isDeleted: false }
      })

      return customers.filter(customer => customer.customerAddress).length
    } catch (error) {
      console.error('Error counting customers with address:', error)
      return 0
    }
  }
}

export default CustomersRepository