import { Repository, Like, Between } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { AppDataSource } from '@shared/typeorm'
import ITaxesRepository, { TaxFilters } from './ITaxesRepository'
import Tax from '../entities/Tax'

export default class TaxesRepository implements ITaxesRepository {
  private repository: Repository<Tax>

  constructor() {
    this.repository = AppDataSource.getRepository(Tax)
  }

  async create(tax: Tax): Promise<IResult<Tax>> {
    try {
      // Verificar se nome já existe
      const nameExists = await this.existsByNameAndCategory(tax.name, tax.idCategory)
      if (nameExists) {
        return {
          success: false,
          message: 'Já existe um imposto com este nome para esta categoria',
          data: null
        }
      }

      const savedTax = await this.repository.save(tax)
      return {
        success: true,
        message: 'Imposto criado com sucesso',
        data: savedTax
      }
    } catch (error) {
      console.error('TaxesRepository.create:', error)
      return {
        success: false,
        message: 'Erro interno ao criar imposto',
        data: null
      }
    }
  }

  async findById(id: string): Promise<IResult<Tax>> {
    try {
      const tax = await this.repository.findOne({
        where: { id },
        relations: ['category']
      })

      if (!tax) {
        return {
          success: false,
          message: 'Imposto não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Imposto encontrado',
        data: tax
      }
    } catch (error) {
      console.error('TaxesRepository.findById:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar imposto',
        data: null
      }
    }
  }

  async findByName(name: string): Promise<IResult<Tax>> {
    try {
      const tax = await this.repository.findOne({
        where: { name },
        relations: ['category']
      })

      if (!tax) {
        return {
          success: false,
          message: 'Imposto não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Imposto encontrado',
        data: tax
      }
    } catch (error) {
      console.error('TaxesRepository.findByName:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar imposto',
        data: null
      }
    }
  }

  async findByCategory(categoryId: string): Promise<IResult<Tax[]>> {
    try {
      const taxes = await this.repository.find({
        where: { idCategory: categoryId, isDeleted: false },
        relations: ['category'],
        order: { percentage: 'ASC', name: 'ASC' }
      })

      return {
        success: true,
        message: 'Impostos da categoria encontrados',
        data: taxes
      }
    } catch (error) {
      console.error('TaxesRepository.findByCategory:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar impostos da categoria',
        data: []
      }
    }
  }

  async findWithFilters(filters: TaxFilters): Promise<IPaginationResult<Tax>> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('tax')
        .leftJoinAndSelect('tax.category', 'category')

      if (filters.name) {
        queryBuilder.andWhere('tax.name ILIKE :name', { name: `%${filters.name}%` })
      }

      if (filters.idCategory) {
        queryBuilder.andWhere('tax.idCategory = :idCategory', { idCategory: filters.idCategory })
      }

      if (filters.percentage !== undefined) {
        queryBuilder.andWhere('tax.percentage = :percentage', { percentage: filters.percentage })
      }

      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('tax.isActive = :isActive', { isActive: filters.isActive })
      }

      queryBuilder.andWhere('tax.isDeleted = false')

      const orderBy = filters.orderBy || 'createdAt'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`tax.${orderBy}`, orderDirection)

      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      queryBuilder.skip(skip).take(pageSize)

      const [taxes, totalItems] = await queryBuilder.getManyAndCount()
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        message: 'Impostos encontrados',
        data: taxes,
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
      console.error('TaxesRepository.findWithFilters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar impostos',
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

  async update(id: string, taxData: Partial<Tax>): Promise<IResult<Tax>> {
    try {
      const existingTax = await this.repository.findOne({ where: { id } })
      if (!existingTax) {
        return {
          success: false,
          message: 'Imposto não encontrado',
          data: null
        }
      }

      // Se estiver atualizando nome, verificar se não já existe na mesma categoria
      if (taxData.name && taxData.name !== existingTax.name) {
        const categoryId = taxData.idCategory || existingTax.idCategory
        const nameExists = await this.existsByNameAndCategory(taxData.name, categoryId, id)
        if (nameExists) {
          return {
            success: false,
            message: 'Já existe um imposto com este nome para esta categoria',
            data: null
          }
        }
      }

      Object.assign(existingTax, taxData)
      existingTax.updatedAt = new Date()

      const updatedTax = await this.repository.save(existingTax)
      
      return {
        success: true,
        message: 'Imposto atualizado com sucesso',
        data: updatedTax
      }
    } catch (error) {
      console.error('TaxesRepository.update:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar imposto',
        data: null
      }
    }
  }

  async delete(id: string): Promise<IResult<void>> {
    try {
      const tax = await this.repository.findOne({ where: { id } })
      if (!tax) {
        return {
          success: false,
          message: 'Imposto não encontrado',
          data: null
        }
      }

      tax.isDeleted = true
      tax.deletedAt = new Date()
      await this.repository.save(tax)

      return {
        success: true,
        message: 'Imposto deletado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('TaxesRepository.delete:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar imposto',
        data: null
      }
    }
  }

  async restore(id: string): Promise<IResult<void>> {
    try {
      const tax = await this.repository.findOne({ 
        where: { id },
        withDeleted: true 
      })

      if (!tax) {
        return {
          success: false,
          message: 'Imposto não encontrado',
          data: null
        }
      }

      tax.isDeleted = false
      tax.deletedAt = null
      await this.repository.save(tax)

      return {
        success: true,
        message: 'Imposto restaurado com sucesso',
        data: null
      }
    } catch (error) {
      console.error('TaxesRepository.restore:', error)
      return {
        success: false,
        message: 'Erro interno ao restaurar imposto',
        data: null
      }
    }
  }

  async findAllActive(): Promise<IResult<Tax[]>> {
    try {
      const taxes = await this.repository.find({
        where: { isDeleted: false },
        relations: ['category'],
        order: { name: 'ASC' }
      })

      return {
        success: true,
        message: 'Impostos ativos encontrados',
        data: taxes
      }
    } catch (error) {
      console.error('TaxesRepository.findAllActive:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar impostos ativos',
        data: []
      }
    }
  }

  async findAll(page: number = 1, pageSize: number = 20): Promise<IPaginationResult<Tax>> {
    return this.findWithFilters({ page, pageSize })
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { name, isDeleted: false }
      })
      return count > 0
    } catch (error) {
      console.error('TaxesRepository.existsByName:', error)
      return false
    }
  }

  async existsByNameAndCategory(name: string, categoryId: string, excludeId?: string): Promise<boolean> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('tax')
        .where('tax.name = :name', { name })
        .andWhere('tax.idCategory = :categoryId', { categoryId })
        .andWhere('tax.isDeleted = false')

      if (excludeId) {
        queryBuilder.andWhere('tax.id != :excludeId', { excludeId })
      }

      const count = await queryBuilder.getCount()
      return count > 0
    } catch (error) {
      console.error('TaxesRepository.existsByNameAndCategory:', error)
      return false
    }
  }

  async getTaxesByPercentageRange(minPercentage: number, maxPercentage: number): Promise<IResult<Tax[]>> {
    try {
      const taxes = await this.repository.find({
        where: {
          percentage: Between(minPercentage, maxPercentage),
          isDeleted: false
        },
        relations: ['category'],
        order: { percentage: 'ASC' }
      })

      return {
        success: true,
        message: 'Impostos encontrados',
        data: taxes
      }
    } catch (error) {
      console.error('TaxesRepository.getTaxesByPercentageRange:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar impostos por percentual',
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
      console.error('TaxesRepository.count:', error)
      return 0
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isDeleted: false }
      })
    } catch (error) {
      console.error('TaxesRepository.countActive:', error)
      return 0
    }
  }

  async countByCategory(categoryId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { idCategory: categoryId, isDeleted: false }
      })
    } catch (error) {
      console.error('TaxesRepository.countByCategory:', error)
      return 0
    }
  }
}