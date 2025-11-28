import { Repository, Like, Between, In, Raw } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { AppDataSource } from '@shared/typeorm'
import IInventoryRepository, { InventoryFilters, StockFilters, InventoryStatistics } from './IInventoryRepository'
import Inventory from '../entities/Inventory'
import InventoryStock from '../entities/InventoryStock'

export default class InventoriesRepository implements IInventoryRepository {
  private inventoryRepository: Repository<Inventory>
  private stockRepository: Repository<InventoryStock>

  constructor() {
    this.inventoryRepository = AppDataSource.getRepository(Inventory)
    this.stockRepository = AppDataSource.getRepository(InventoryStock)
  }

  // === MOVEMENTS IMPLEMENTATION ===

  async createMovement(inventory: Inventory): Promise<IResult<Inventory>> {
    try {
      if (!inventory.isValid()) {
        return {
          success: false,
          message: 'Dados do movimento de estoque são inválidos',
          data: null
        }
      }

      const savedMovement = await this.inventoryRepository.save(inventory)
      return {
        success: true,
        message: 'Movimento de estoque criado com sucesso',
        data: savedMovement
      }
    } catch (error) {
      console.error('InventoriesRepository.createMovement:', error)
      return {
        success: false,
        message: 'Erro interno ao criar movimento de estoque',
        data: null
      }
    }
  }

  async findMovementById(id: string): Promise<IResult<Inventory>> {
    try {
      const movement = await this.inventoryRepository.findOne({
        where: { id },
        relations: ['product', 'company', 'user']
      })

      if (!movement) {
        return {
          success: false,
          message: 'Movimento de estoque não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Movimento de estoque encontrado',
        data: movement
      }
    } catch (error) {
      console.error('InventoriesRepository.findMovementById:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar movimento de estoque',
        data: null
      }
    }
  }

  async findMovementsByProduct(productId: string): Promise<IResult<Inventory[]>> {
    try {
      const movements = await this.inventoryRepository.find({
        where: { productId, isDeleted: false },
        order: { createdAt: 'DESC' }
      })

      return {
        success: true,
        message: 'Movimentos do produto encontrados',
        data: movements
      }
    } catch (error) {
      console.error('InventoriesRepository.findMovementsByProduct:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar movimentos do produto',
        data: []
      }
    }
  }

  async findMovementsByCompany(companyId: string): Promise<IResult<Inventory[]>> {
    try {
      const movements = await this.inventoryRepository.find({
        where: { companyId, isDeleted: false },
        order: { createdAt: 'DESC' }
      })

      return {
        success: true,
        message: 'Movimentos da empresa encontrados',
        data: movements
      }
    } catch (error) {
      console.error('InventoriesRepository.findMovementsByCompany:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar movimentos da empresa',
        data: []
      }
    }
  }

  async findMovementsWithFilters(filters: InventoryFilters): Promise<IPaginationResult<Inventory>> {
    try {
      const queryBuilder = this.inventoryRepository.createQueryBuilder('movement')
        .leftJoinAndSelect('movement.product', 'product')
        .leftJoinAndSelect('movement.company', 'company')
        .leftJoinAndSelect('movement.user', 'user')

      // Aplicar filtros
      if (filters.productId) {
        queryBuilder.andWhere('movement.productId = :productId', { productId: filters.productId })
      }

      if (filters.companyId) {
        queryBuilder.andWhere('movement.companyId = :companyId', { companyId: filters.companyId })
      }

      if (filters.userId) {
        queryBuilder.andWhere('movement.userId = :userId', { userId: filters.userId })
      }

      if (filters.movementType) {
        queryBuilder.andWhere('movement.movementType = :movementType', { movementType: filters.movementType })
      }

      if (filters.movementReason) {
        queryBuilder.andWhere('movement.movementReason = :movementReason', { movementReason: filters.movementReason })
      }

      if (filters.status) {
        queryBuilder.andWhere('movement.status = :status', { status: filters.status })
      }

      if (filters.qualityStatus) {
        queryBuilder.andWhere('movement.qualityStatus = :qualityStatus', { qualityStatus: filters.qualityStatus })
      }

      if (filters.referenceType) {
        queryBuilder.andWhere('movement.referenceType = :referenceType', { referenceType: filters.referenceType })
      }

      if (filters.referenceId) {
        queryBuilder.andWhere('movement.referenceId = :referenceId', { referenceId: filters.referenceId })
      }

      if (filters.minQuantity !== undefined) {
        queryBuilder.andWhere('movement.quantity >= :minQuantity', { minQuantity: filters.minQuantity })
      }

      if (filters.maxQuantity !== undefined) {
        queryBuilder.andWhere('movement.quantity <= :maxQuantity', { maxQuantity: filters.maxQuantity })
      }

      if (filters.minDate) {
        queryBuilder.andWhere('movement.createdAt >= :minDate', { minDate: filters.minDate })
      }

      if (filters.maxDate) {
        queryBuilder.andWhere('movement.createdAt <= :maxDate', { maxDate: filters.maxDate })
      }

      if (filters.location) {
        queryBuilder.andWhere('movement.location ILIKE :location', { location: `%${filters.location}%` })
      }

      if (filters.warehouseZone) {
        queryBuilder.andWhere('movement.warehouseZone = :warehouseZone', { warehouseZone: filters.warehouseZone })
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(product.name ILIKE :search OR movement.referenceNumber ILIKE :search OR movement.notes ILIKE :search)',
          { search: `%${filters.search}%` }
        )
      }

      queryBuilder.andWhere('movement.isDeleted = false')

      // Ordenação
      const orderBy = filters.orderBy || 'createdAt'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`movement.${orderBy}`, orderDirection)

      // Paginação
      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      queryBuilder.skip(skip).take(pageSize)

      const [movements, totalItems] = await queryBuilder.getManyAndCount()
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        message: 'Movimentos encontrados',
        data: movements,
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
      console.error('InventoriesRepository.findMovementsWithFilters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar movimentos',
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

  // === STOCK IMPLEMENTATION ===

  async createOrUpdateStock(stock: InventoryStock): Promise<IResult<InventoryStock>> {
    try {
      if (!stock.isValid()) {
        return {
          success: false,
          message: 'Dados do estoque são inválidos',
          data: null
        }
      }

      // Tentar encontrar estoque existente para o mesmo produto e empresa
      const existingStock = await this.stockRepository.findOne({
        where: { productId: stock.productId, companyId: stock.companyId }
      })

      if (existingStock) {
        // Atualizar estoque existente
        Object.assign(existingStock, stock)
        existingStock.updatedAt = new Date()
        const updatedStock = await this.stockRepository.save(existingStock)
        
        return {
          success: true,
          message: 'Estoque atualizado com sucesso',
          data: updatedStock
        }
      } else {
        // Criar novo estoque
        const savedStock = await this.stockRepository.save(stock)
        return {
          success: true,
          message: 'Estoque criado com sucesso',
          data: savedStock
        }
      }
    } catch (error) {
      console.error('InventoriesRepository.createOrUpdateStock:', error)
      return {
        success: false,
        message: 'Erro interno ao criar/atualizar estoque',
        data: null
      }
    }
  }

  async findStockByProduct(productId: string): Promise<IResult<InventoryStock>> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { productId, isDeleted: false },
        relations: ['product', 'company']
      })

      if (!stock) {
        return {
          success: false,
          message: 'Estoque do produto não encontrado',
          data: null
        }
      }

      return {
        success: true,
        message: 'Estoque do produto encontrado',
        data: stock
      }
    } catch (error) {
      console.error('InventoriesRepository.findStockByProduct:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar estoque do produto',
        data: null
      }
    }
  }

  async findStocksByCompany(companyId: string): Promise<IResult<InventoryStock[]>> {
    try {
      const stocks = await this.stockRepository.find({
        where: { companyId, isDeleted: false },
        relations: ['product', 'company'],
        order: { totalQuantity: 'DESC' }
      })

      return {
        success: true,
        message: 'Estoques da empresa encontrados',
        data: stocks
      }
    } catch (error) {
      console.error('InventoriesRepository.findStocksByCompany:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar estoques da empresa',
        data: []
      }
    }
  }

  async findStocksWithFilters(filters: StockFilters): Promise<IPaginationResult<InventoryStock>> {
    try {
      const queryBuilder = this.stockRepository.createQueryBuilder('stock')
        .leftJoinAndSelect('stock.product', 'product')
        .leftJoinAndSelect('stock.company', 'company')

      // Aplicar filtros
      if (filters.productId) {
        queryBuilder.andWhere('stock.productId = :productId', { productId: filters.productId })
      }

      if (filters.companyId) {
        queryBuilder.andWhere('stock.companyId = :companyId', { companyId: filters.companyId })
      }

      if (filters.location) {
        queryBuilder.andWhere('stock.location ILIKE :location', { location: `%${filters.location}%` })
      }

      if (filters.warehouseZone) {
        queryBuilder.andWhere('stock.warehouseZone = :warehouseZone', { warehouseZone: filters.warehouseZone })
      }

      if (filters.abcClassification) {
        queryBuilder.andWhere('stock.abcClassification = :abcClassification', { abcClassification: filters.abcClassification })
      }

      if (filters.stockoutRiskLevel) {
        queryBuilder.andWhere('stock.stockoutRiskLevel = :stockoutRiskLevel', { stockoutRiskLevel: filters.stockoutRiskLevel })
      }

      if (filters.minTotalQuantity !== undefined) {
        queryBuilder.andWhere('stock.totalQuantity >= :minTotalQuantity', { minTotalQuantity: filters.minTotalQuantity })
      }

      if (filters.maxTotalQuantity !== undefined) {
        queryBuilder.andWhere('stock.totalQuantity <= :maxTotalQuantity', { maxTotalQuantity: filters.maxTotalQuantity })
      }

      if (filters.minAvailableQuantity !== undefined) {
        queryBuilder.andWhere('stock.availableQuantity >= :minAvailableQuantity', { minAvailableQuantity: filters.minAvailableQuantity })
      }

      if (filters.maxAvailableQuantity !== undefined) {
        queryBuilder.andWhere('stock.availableQuantity <= :maxAvailableQuantity', { maxAvailableQuantity: filters.maxAvailableQuantity })
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search OR stock.location ILIKE :search)',
          { search: `%${filters.search}%` }
        )
      }

      queryBuilder.andWhere('stock.isDeleted = false')

      // Ordenação
      const orderBy = filters.orderBy || 'totalQuantity'
      const orderDirection = filters.orderDirection || 'DESC'
      queryBuilder.orderBy(`stock.${orderBy}`, orderDirection)

      // Paginação
      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      queryBuilder.skip(skip).take(pageSize)

      const [stocks, totalItems] = await queryBuilder.getManyAndCount()
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        message: 'Estoques encontrados',
        data: stocks,
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
      console.error('InventoriesRepository.findStocksWithFilters:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar estoques',
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

  // === BASIC IMPLEMENTATIONS (simplified) ===

  async updateMovement(id: string, inventory: Partial<Inventory>): Promise<IResult<Inventory>> {
    try {
      const existing = await this.findMovementById(id)
      if (!existing.success) {
        return existing
      }

      Object.assign(existing.data, inventory)
      existing.data.updatedAt = new Date()

      const updated = await this.inventoryRepository.save(existing.data)

      return {
        success: true,
        message: 'Movimento atualizado com sucesso',
        data: updated
      }
    } catch (error) {
      console.error('InventoriesRepository.updateMovement:', error)
      return {
        success: false,
        message: 'Erro interno ao atualizar movimento',
        data: null
      }
    }
  }

  async findAllActiveStocks(): Promise<IResult<InventoryStock[]>> {
    try {
      const stocks = await this.stockRepository.find({
        where: { isDeleted: false },
        relations: ['product', 'company']
      })

      return {
        success: true,
        message: 'Estoques ativos encontrados',
        data: stocks
      }
    } catch (error) {
      console.error('InventoriesRepository.findAllActiveStocks:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar estoques ativos',
        data: []
      }
    }
  }

  async count(): Promise<number> {
    try {
      return await this.stockRepository.count({ where: { isDeleted: false } })
    } catch (error) {
      console.error('InventoriesRepository.count:', error)
      return 0
    }
  }

  // === PLACEHOLDER IMPLEMENTATIONS ===

  async updateStock(id: string, stock: Partial<InventoryStock>): Promise<IResult<InventoryStock>> {
    // Placeholder - implementar lógica completa de atualização de estoque
    return {
      success: false,
      message: 'Operação não implementada',
      data: null
    }
  }

  async getStatistics(): Promise<IResult<InventoryStatistics>> {
    // Placeholder - implementar cálculo de estatísticas
    return {
      success: false,
      message: 'Operação não implementada',
      data: null
    }
  }

  // Adicione mais implementações conforme necessário...
}