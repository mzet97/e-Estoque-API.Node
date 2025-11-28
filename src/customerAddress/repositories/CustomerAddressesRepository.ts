import { Repository, Like } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { AppDataSource } from '@shared/typeorm'
import ICustomerAddressesRepository, { CustomerAddressFilters } from './ICustomerAddressesRepository'
import CustomerAddress from '../entities/CustomerAddress'

export default class CustomerAddressesRepository implements ICustomerAddressesRepository {
  private repository: Repository<CustomerAddress>

  constructor() {
    this.repository = AppDataSource.getRepository(CustomerAddress)
  }

  async create(address: CustomerAddress): Promise<IResult<CustomerAddress>> {
    try {
      if (!address.isValid()) {
        return {
          success: false,
          message: 'Dados do endereço são inválidos',
          data: null
        }
      }

      // Se for marcado como padrão, remover outros padrões do cliente
      if (address.isDefault) {
        await this.removeDefault(address.customerId)
      }

      const savedAddress = await this.repository.save(address)
      return {
        success: true,
        message: 'Endereço do cliente criado com sucesso',
        data: savedAddress
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.create:', error)
      return {
        success: false,
        message: 'Erro interno ao criar endereço do cliente',
        data: null
      }
    }
  }

  async findById(id: string): Promise<IResult<CustomerAddress>> {
    try {
      const address = await this.repository.findOne({
        where: { id },
        relations: ['customer']
      })

      if (!address) {
        return {
          success: false,
          message: 'Endereço do cliente não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Endereço do cliente encontrado',
        data: address
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findById:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereço do cliente',
        data: null
      }
    }
  }

  async findByCustomerId(customerId: string): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { customerId, isDeleted: false },
        relations: ['customer'],
        order: { type: 'ASC', city: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços do cliente encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findByCustomerId:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereços do cliente',
        data: []
      }
    }
  }

  async findDefault(customerId: string): Promise<IResult<CustomerAddress>> {
    try {
      const address = await this.repository.findOne({
        where: { 
          customerId, 
          isDefault: true,
          isDeleted: false
        },
        relations: ['customer']
      })

      if (!address) {
        return {
          success: false,
          message: 'Endereço padrão do cliente não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Endereço padrão do cliente encontrado',
        data: address
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findDefault:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereço padrão',
        data: null
      }
    }
  }

  async findWithFilters(filters: CustomerAddressFilters): Promise<IPaginationResult<CustomerAddress>> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('address')
        .leftJoinAndSelect('address.customer', 'customer')

      if (filters.customerId) {
        queryBuilder.andWhere('address.customerId = :customerId', { customerId: filters.customerId })
      }

      if (filters.type) {
        queryBuilder.andWhere('address.type = :type', { type: filters.type })
      }

      if (filters.city) {
        queryBuilder.andWhere('address.city ILIKE :city', { city: `%${filters.city}%` })
      }

      if (filters.state) {
        queryBuilder.andWhere('address.state = :state', { state: filters.state })
      }

      if (filters.isDefault !== undefined) {
        queryBuilder.andWhere('address.isDefault = :isDefault', { isDefault: filters.isDefault })
      }

      queryBuilder.andWhere('address.isDeleted = false')

      const orderBy = filters.orderBy || 'createdAt'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`address.${orderBy}`, orderDirection)

      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      queryBuilder.skip(skip).take(pageSize)

      const [addresses, totalItems] = await queryBuilder.getManyAndCount()
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findWithFilters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereços',
        data: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      }
    }
  }

  async update(id: string, addressData: Partial<CustomerAddress>): Promise<IResult<CustomerAddress>> {
    try {
      const existingAddress = await this.repository.findOne({ where: { id } })
      if (!existingAddress) {
        return {
          success: false,
          message: 'Endereço do cliente não encontrado',
          data: null
        }
      }

      if (addressData.isDefault && !existingAddress.isDefault) {
        await this.removeDefault(existingAddress.customerId)
      }

      Object.assign(existingAddress, addressData)
      existingAddress.updatedAt = new Date()

      const updatedAddress = await this.repository.save(existingAddress)
      
      return {
        success: true,
        message: 'Endereço do cliente atualizado com sucesso',
        data: updatedAddress
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.update:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar endereço do cliente',
        data: null
      }
    }
  }

  async delete(id: string): Promise<IResult<void>> {
    try {
      const address = await this.repository.findOne({ where: { id } })
      if (!address) {
        return {
          success: false,
          message: 'Endereço do cliente não encontrado',
          data: null
        }
      }

      if (address.isDefault) {
        return {
          success: false,
          message: 'Não é possível deletar o endereço padrão. Defina outro endereço como padrão primeiro.',
          data: null
        }
      }

      address.isDeleted = true
      address.deletedAt = new Date()
      await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço do cliente deletado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.delete:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar endereço do cliente',
        data: null
      }
    }
  }

  async restore(id: string): Promise<IResult<void>> {
    try {
      const address = await this.repository.findOne({ 
        where: { id },
        withDeleted: true 
      })

      if (!address) {
        return {
          success: false,
          message: 'Endereço do cliente não encontrado',
          data: null
        }
      }

      address.isDeleted = false
      address.deletedAt = null
      await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço do cliente restaurado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.restore:', error)
      return {
        success: false,
        message: 'Erro interno ao restaurar endereço do cliente',
        data: null
      }
    }
  }

  async findAllActive(): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { isDeleted: false },
        relations: ['customer'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços ativos encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findAllActive:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereços ativos',
        data: []
      }
    }
  }

  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<CustomerAddress>> {
    return this.findWithFilters({ page, pageSize })
  }

  async existsById(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id, isDeleted: false }
      })
      return count > 0
    } catch (error) {
      console.error('CustomerAddressesRepository.existsById:', error)
      return false
    }
  }

  async isDefault(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id, isDefault: true, isDeleted: false }
      })
      return count > 0
    } catch (error) {
      console.error('CustomerAddressesRepository.isDefault:', error)
      return false
    }
  }

  async getDefaultCount(customerId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { customerId, isDefault: true, isDeleted: false }
      })
    } catch (error) {
      console.error('CustomerAddressesRepository.getDefaultCount:', error)
      return 0
    }
  }

  async setAsDefault(id: string): Promise<IResult<CustomerAddress>> {
    try {
      const address = await this.repository.findOne({ where: { id } })
      if (!address) {
        return {
          success: false,
          message: 'Endereço do cliente não encontrado',
          data: null
        }
      }

      await this.removeDefault(address.customerId)

      address.isDefault = true
      address.updatedAt = new Date()

      const updatedAddress = await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço definido como padrão do cliente',
        data: updatedAddress
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.setAsDefault:', error)
      return {
        success: false,
        message: 'Erro interno ao definir como padrão',
        data: null
      }
    }
  }

  async removeDefault(customerId: string): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { customerId, isDefault: true, isDeleted: false }
      })

      for (const address of addresses) {
        address.isDefault = false
        address.updatedAt = new Date()
        await this.repository.save(address)
      }

      return {
        success: true,
        message: 'Endereços padrão removidos com sucesso',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.removeDefault:', error)
      return {
        success: false,
        message: 'Erro interno ao remover endereços padrão',
        data: []
      }
    }
  }

  async count(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('CustomerAddressesRepository.count:', error)
      return 0
    }
  }

  async countByCustomer(customerId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { customerId, isDeleted: false }
      })
    } catch (error) {
      console.error('CustomerAddressesRepository.countByCustomer:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('CustomerAddressesRepository.countActive:', error)
      return 0
    }
  }

  async findByCity(city: string): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          city: Like(`%${city}%`), 
          isDeleted: false 
        },
        relations: ['customer'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findByCity:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por cidade',
        data: []
      }
    }
  }

  async findByState(state: string): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          state, 
          isDeleted: false 
        },
        relations: ['customer'],
        order: { city: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findByState:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por estado',
        data: []
      }
    }
  }

  async findByZipCode(zipCode: string): Promise<IResult<CustomerAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          zipCode, 
          isDeleted: false 
        },
        relations: ['customer'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CustomerAddressesRepository.findByZipCode:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por CEP',
        data: []
      }
    }
  }
}