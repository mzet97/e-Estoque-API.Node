import { Repository, Like, Not } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { AppDataSource } from '@shared/typeorm'
import ICompanyAddressesRepository, { CompanyAddressFilters } from './ICompanyAddressesRepository'
import CompanyAddress from '../entities/CompanyAddress'

export default class CompanyAddressesRepository implements ICompanyAddressesRepository {
  private repository: Repository<CompanyAddress>

  constructor() {
    this.repository = AppDataSource.getRepository(CompanyAddress)
  }

  async create(address: CompanyAddress): Promise<IResult<CompanyAddress>> {
    try {
      // Verificar se empresa existe e se o endereço é válido
      if (!address.isValid()) {
        return {
          success: false,
          message: 'Dados do endereço são inválidos',
          data: null
        }
      }

      // Se for marcado como headquarters, remover outras sedes da empresa
      if (address.isHeadquarters) {
        await this.removeHeadquarters(address.companyId)
      }

      const savedAddress = await this.repository.save(address)
      return {
        success: true,
        message: 'Endereço da empresa criado com sucesso',
        data: savedAddress
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.create:', error)
      return {
        success: false,
        message: 'Erro interno ao criar endereço da empresa',
        data: null
      }
    }
  }

  async findById(id: string): Promise<IResult<CompanyAddress>> {
    try {
      const address = await this.repository.findOne({
        where: { id },
        relations: ['company']
      })

      if (!address) {
        return {
          success: false,
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Endereço da empresa encontrado',
        data: address
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findById:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereço da empresa',
        data: null
      }
    }
  }

  async findByCompanyId(companyId: string): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { companyId, isDeleted: false },
        relations: ['company'],
        order: { type: 'ASC', city: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços da empresa encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findByCompanyId:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereços da empresa',
        data: []
      }
    }
  }

  async findHeadquarters(companyId: string): Promise<IResult<CompanyAddress>> {
    try {
      const address = await this.repository.findOne({
        where: { 
          companyId, 
          isHeadquarters: true,
          isDeleted: false
        },
        relations: ['company']
      })

      if (!address) {
        return {
          success: false,
          message: 'Sede da empresa não encontrada',
          data: null
        }
      }

      return {
        success: true,
        message: 'Sede da empresa encontrada',
        data: address
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findHeadquarters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar sede da empresa',
        data: null
      }
    }
  }

  async findWithFilters(filters: CompanyAddressFilters): Promise<IPaginationResult<CompanyAddress>> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('address')
        .leftJoinAndSelect('address.company', 'company')

      // Aplicar filtros
      if (filters.companyId) {
        queryBuilder.andWhere('address.companyId = :companyId', { companyId: filters.companyId })
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

      if (filters.isHeadquarters !== undefined) {
        queryBuilder.andWhere('address.isHeadquarters = :isHeadquarters', { 
          isHeadquarters: filters.isHeadquarters 
        })
      }

      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('address.isActive = :isActive', { isActive: filters.isActive })
      }

      if (filters.department) {
        queryBuilder.andWhere('address.department ILIKE :department', { 
          department: `%${filters.department}%` 
        })
      }

      if (filters.contactPerson) {
        queryBuilder.andWhere('address.contactPerson ILIKE :contactPerson', { 
          contactPerson: `%${filters.contactPerson}%` 
        })
      }

      // Excluir endereços deletados
      queryBuilder.andWhere('address.isDeleted = false')

      // Ordenação
      const orderBy = filters.orderBy || 'createdAt'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`address.${orderBy}`, orderDirection)

      // Paginação
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
      console.error('CompanyAddressesRepository.findWithFilters:', error)
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

  async update(id: string, addressData: Partial<CompanyAddress>): Promise<IResult<CompanyAddress>> {
    try {
      const existingAddress = await this.repository.findOne({ where: { id } })
      if (!existingAddress) {
        return {
          success: false,
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      // Se estiver marcando como headquarters, remover outras sedes
      if (addressData.isHeadquarters && !existingAddress.isHeadquarters) {
        await this.removeHeadquarters(existingAddress.companyId)
      }

      Object.assign(existingAddress, addressData)
      existingAddress.updatedAt = new Date()

      const updatedAddress = await this.repository.save(existingAddress)
      
      return {
        success: true,
        message: 'Endereço da empresa atualizado com sucesso',
        data: updatedAddress
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.update:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar endereço da empresa',
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
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      // Não permitir deletar a sede da empresa
      if (address.isHeadquarters) {
        return {
          success: false,
          message: 'Não é possível deletar a sede da empresa. Defina outro endereço como sede primeiro.',
          data: null
        }
      }

      address.isDeleted = true
      address.deletedAt = new Date()
      await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço da empresa deletado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.delete:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar endereço da empresa',
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
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      address.isDeleted = false
      address.deletedAt = null
      await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço da empresa restaurado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.restore:', error)
      return {
        success: false,
        message: 'Erro interno ao restaurar endereço da empresa',
        data: null
      }
    }
  }

  async findAllActive(): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { isActive: true, isDeleted: false },
        relations: ['company'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços ativos encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findAllActive:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereços ativos',
        data: []
      }
    }
  }

  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<CompanyAddress>> {
    return this.findWithFilters({ page, pageSize })
  }

  async existsById(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id, isDeleted: false }
      })
      return count > 0
    } catch (error) {
      console.error('CompanyAddressesRepository.existsById:', error)
      return false
    }
  }

  async isHeadquarters(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id, isHeadquarters: true, isDeleted: false }
      })
      return count > 0
    } catch (error) {
      console.error('CompanyAddressesRepository.isHeadquarters:', error)
      return false
    }
  }

  async getHeadquartersCount(companyId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { companyId, isHeadquarters: true, isDeleted: false }
      })
    } catch (error) {
      console.error('CompanyAddressesRepository.getHeadquartersCount:', error)
      return 0
    }
  }

  async setAsHeadquarters(id: string): Promise<IResult<CompanyAddress>> {
    try {
      const address = await this.repository.findOne({ where: { id } })
      if (!address) {
        return {
          success: false,
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      // Remover outras sedes da empresa
      await this.removeHeadquarters(address.companyId)

      // Definir como sede
      address.isHeadquarters = true
      address.updatedAt = new Date()

      const updatedAddress = await this.repository.save(address)

      return {
        success: true,
        message: 'Endereço definido como sede da empresa',
        data: updatedAddress
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.setAsHeadquarters:', error)
      return {
        success: false,
        message: 'Erro interno ao definir como sede',
        data: null
      }
    }
  }

  async removeHeadquarters(companyId: string): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { companyId, isHeadquarters: true, isDeleted: false }
      })

      for (const address of addresses) {
        address.isHeadquarters = false
        address.updatedAt = new Date()
        await this.repository.save(address)
      }

      return {
        success: true,
        message: 'Sedes removidas com sucesso',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.removeHeadquarters:', error)
      return {
        success: false,
        message: 'Erro interno ao remover sedes',
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
      console.error('CompanyAddressesRepository.count:', error)
      return 0
    }
  }

  async countByCompany(companyId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { companyId, isDeleted: false }
      })
    } catch (error) {
      console.error('CompanyAddressesRepository.countByCompany:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isActive: true, isDeleted: false }
      })
    } catch (error) {
      console.error('CompanyAddressesRepository.countActive:', error)
      return 0
    }
  }

  async findByCity(city: string): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          city: Like(`%${city}%`), 
          isDeleted: false 
        },
        relations: ['company'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findByCity:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por cidade',
        data: []
      }
    }
  }

  async findByState(state: string): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          state, 
          isDeleted: false 
        },
        relations: ['company'],
        order: { city: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findByState:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por estado',
        data: []
      }
    }
  }

  async findByZipCode(zipCode: string): Promise<IResult<CompanyAddress[]>> {
    try {
      const addresses = await this.repository.find({
        where: { 
          zipCode, 
          isDeleted: false 
        },
        relations: ['company'],
        order: { city: 'ASC', state: 'ASC' }
      })

      return {
        success: true,
        message: 'Endereços encontrados',
        data: addresses
      }
    } catch (error) {
      console.error('CompanyAddressesRepository.findByZipCode:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar por CEP',
        data: []
      }
    }
  }
}