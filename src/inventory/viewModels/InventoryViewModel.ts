import Inventory, { MovementType, MovementReason } from '../entities/Inventory'
import InventoryStock from '../entities/InventoryStock'

export interface CreateInventoryMovementViewModel {
  productId: string
  companyId: string
  userId: string
  movementType: MovementType
  movementReason: MovementReason
  quantity: number
  previousQuantity: number
  referenceId?: string
  referenceType?: string
  referenceNumber?: string
  unitCost?: number
  unitPrice?: number
  location?: string
  warehouseZone?: string
  notes?: string
}

export interface UpdateInventoryMovementViewModel {
  movementType?: MovementType
  movementReason?: MovementReason
  quantity?: number
  previousQuantity?: number
  unitCost?: number
  unitPrice?: number
  location?: string
  warehouseZone?: string
  notes?: string
  internalNotes?: string
  qualityStatus?: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'DEFECTIVE' | 'QUARANTINE'
}

export interface CreateInventoryStockViewModel {
  productId: string
  companyId: string
  totalQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  reorderPoint?: number
  safetyStock?: number
  location?: string
  warehouseZone?: string
}

export interface UpdateInventoryStockViewModel {
  totalQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  reorderPoint?: number
  safetyStock?: number
  location?: string
  warehouseZone?: string
  allowNegativeStock?: boolean
  autoReorderEnabled?: boolean
  notes?: string
}

export interface ListInventoryMovementsViewModel {
  productId?: string
  companyId?: string
  userId?: string
  movementType?: MovementType
  movementReason?: MovementReason
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  qualityStatus?: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'DEFECTIVE' | 'QUARANTINE'
  referenceType?: string
  referenceId?: string
  minQuantity?: number
  maxQuantity?: number
  minDate?: Date
  maxDate?: Date
  location?: string
  warehouseZone?: string
  page?: number
  pageSize?: number
  orderBy?: 'createdAt' | 'quantity' | 'movementType'
  orderDirection?: 'ASC' | 'DESC'
  search?: string
}

export interface ListInventoryStockViewModel {
  productId?: string
  companyId?: string
  location?: string
  warehouseZone?: string
  abcClassification?: 'A' | 'B' | 'C'
  stockoutRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  minTotalQuantity?: number
  maxTotalQuantity?: number
  minAvailableQuantity?: number
  maxAvailableQuantity?: number
  page?: number
  pageSize?: number
  orderBy?: 'totalQuantity' | 'availableQuantity' | 'minStockLevel' | 'totalInvestment'
  orderDirection?: 'ASC' | 'DESC'
  search?: string
}

export interface ShowInventoryMovementViewModel {
  id: string
  productId: string
  companyId: string
  userId: string
  movementType: MovementType
  movementReason: MovementReason
  quantity: number
  previousQuantity: number
  currentQuantity: number
  unitCost?: number
  totalCost?: number
  unitPrice?: number
  totalPrice?: number
  referenceId?: string
  referenceType?: string
  referenceNumber?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  batchNumber?: string
  expiryDate?: Date
  location?: string
  warehouseZone?: string
  qualityStatus: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'DEFECTIVE' | 'QUARANTINE'
  notes?: string
  approvedBy?: string
  approvedAt?: Date
  cancelledBy?: string
  cancelledAt?: Date
  cancellationReason?: string
  product?: {
    id: string
    name: string
    sku?: string
  }
  company?: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ShowInventoryStockViewModel {
  id: string
  productId: string
  companyId: string
  totalQuantity: number
  reservedQuantity: number
  availableQuantity: number
  damagedQuantity: number
  expiredQuantity: number
  quarantineQuantity: number
  minStockLevel: number
  maxStockLevel?: number
  reorderPoint: number
  safetyStock: number
  avgUnitCost: number
  totalInvestment: number
  location?: string
  warehouseZone?: string
  abcClassification?: 'A' | 'B' | 'C'
  leadTimeDays: number
  stockoutRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isTracked: boolean
  allowNegativeStock: boolean
  autoReorderEnabled: boolean
  notes?: string
  product?: {
    id: string
    name: string
    sku?: string
    description?: string
  }
  company?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

export default class InventoryViewModel {
  static fromInventoryMovement(movement: Inventory): ShowInventoryMovementViewModel {
    return {
      id: movement.id,
      productId: movement.productId,
      companyId: movement.companyId,
      userId: movement.userId,
      movementType: movement.movementType,
      movementReason: movement.movementReason,
      quantity: movement.quantity,
      previousQuantity: movement.previousQuantity,
      currentQuantity: movement.currentQuantity,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
      unitPrice: movement.unitPrice,
      totalPrice: movement.totalPrice,
      referenceId: movement.referenceId,
      referenceType: movement.referenceType,
      referenceNumber: movement.referenceNumber,
      status: movement.status,
      batchNumber: movement.batchNumber,
      expiryDate: movement.expiryDate,
      location: movement.location,
      warehouseZone: movement.warehouseZone,
      qualityStatus: movement.qualityStatus,
      notes: movement.notes,
      approvedBy: movement.approvedBy,
      approvedAt: movement.approvedAt,
      cancelledBy: movement.cancelledBy,
      cancelledAt: movement.cancelledAt,
      cancellationReason: movement.cancellationReason,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt
    }
  }

  static fromInventoryMovementList(movements: Inventory[]): ShowInventoryMovementViewModel[] {
    return movements.map(movement => this.fromInventoryMovement(movement))
  }

  static fromInventoryStock(stock: InventoryStock): ShowInventoryStockViewModel {
    return {
      id: stock.id,
      productId: stock.productId,
      companyId: stock.companyId,
      totalQuantity: stock.totalQuantity,
      reservedQuantity: stock.reservedQuantity,
      availableQuantity: stock.availableQuantity,
      damagedQuantity: stock.damagedQuantity,
      expiredQuantity: stock.expiredQuantity,
      quarantineQuantity: stock.quarantineQuantity,
      minStockLevel: stock.minStockLevel,
      maxStockLevel: stock.maxStockLevel,
      reorderPoint: stock.reorderPoint,
      safetyStock: stock.safetyStock,
      avgUnitCost: stock.avgUnitCost,
      totalInvestment: stock.totalInvestment,
      location: stock.location,
      warehouseZone: stock.warehouseZone,
      abcClassification: stock.abcClassification,
      leadTimeDays: stock.leadTimeDays,
      stockoutRiskLevel: stock.stockoutRiskLevel,
      isTracked: stock.isTracked,
      allowNegativeStock: stock.allowNegativeStock,
      autoReorderEnabled: stock.autoReorderEnabled,
      notes: stock.notes,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt
    }
  }

  static fromInventoryStockList(stocks: InventoryStock[]): ShowInventoryStockViewModel[] {
    return stocks.map(stock => this.fromInventoryStock(stock))
  }

  // Método para validar dados de entrada de criação de movimento
  static validateCreateMovementData(data: CreateInventoryMovementViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.productId) {
      errors.push('ProductId é obrigatório')
    }

    if (!data.companyId) {
      errors.push('CompanyId é obrigatório')
    }

    if (!data.userId) {
      errors.push('UserId é obrigatório')
    }

    if (!data.movementType || !['IN', 'OUT'].includes(data.movementType)) {
      errors.push('MovementType deve ser IN ou OUT')
    }

    if (!data.movementReason) {
      errors.push('MovementReason é obrigatório')
    }

    if (data.quantity === undefined || data.quantity <= 0) {
      errors.push('Quantity deve ser maior que 0')
    }

    if (data.previousQuantity === undefined || data.previousQuantity < 0) {
      errors.push('PreviousQuantity deve ser maior ou igual a 0')
    }

    if (data.unitCost !== undefined && data.unitCost < 0) {
      errors.push('UnitCost deve ser maior ou igual a 0')
    }

    if (data.unitPrice !== undefined && data.unitPrice < 0) {
      errors.push('UnitPrice deve ser maior ou igual a 0')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para validar dados de entrada de criação de estoque
  static validateCreateStockData(data: CreateInventoryStockViewModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.productId) {
      errors.push('ProductId é obrigatório')
    }

    if (!data.companyId) {
      errors.push('CompanyId é obrigatório')
    }

    if (data.totalQuantity !== undefined && data.totalQuantity < 0) {
      errors.push('TotalQuantity deve ser maior ou igual a 0')
    }

    if (data.minStockLevel !== undefined && data.minStockLevel < 0) {
      errors.push('MinStockLevel deve ser maior ou igual a 0')
    }

    if (data.maxStockLevel !== undefined && data.maxStockLevel < 0) {
      errors.push('MaxStockLevel deve ser maior ou igual a 0')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Método para formatar quantidade
  static formatQuantity(quantity: number): string {
    return quantity.toFixed(3).replace(/\.?0+$/, '')
  }

  // Método para formatar custo/preço
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Método para calcular status do movimento
  static getMovementStatus(movement: Inventory): {
    status: string
    color: string
    icon: string
  } {
    if (movement.isCancelled()) {
      return {
        status: 'Cancelado',
        color: 'red',
        icon: 'cancel'
      }
    }

    if (movement.isPending()) {
      return {
        status: 'Pendente',
        color: 'orange',
        icon: 'pending'
      }
    }

    return {
      status: 'Confirmado',
      color: 'green',
      icon: 'check'
    }
  }

  // Método para calcular status do estoque
  static getStockStatus(stock: InventoryStock): {
    status: string
    color: string
    icon: string
    description: string
  } {
    if (stock.isOutOfStock()) {
      return {
        status: 'Sem Estoque',
        color: 'red',
        icon: 'remove',
        description: 'Produto não disponível'
      }
    }

    if (stock.isCriticalStock()) {
      return {
        status: 'Crítico',
        color: 'red',
        icon: 'warning',
        description: 'Abaixo do estoque de segurança'
      }
    }

    if (stock.isLowStock()) {
      return {
        status: 'Baixo',
        color: 'orange',
        icon: 'info',
        description: 'Próximo ao ponto de reposição'
      }
    }

    if (stock.maxStockLevel && stock.totalQuantity > stock.maxStockLevel) {
      return {
        status: 'Acima do Máximo',
        color: 'purple',
        icon: 'trending_up',
        description: 'Acima do nível máximo'
      }
    }

    return {
      status: 'Normal',
      color: 'green',
        icon: 'check',
      description: 'Estoque em nível adequado'
    }
  }
}