import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Inventory, { MovementType, MovementReason } from '../entities/Inventory'
import InventoryStock from '../entities/InventoryStock'

// Interface para filtros de busca de movimentos de estoque
export interface InventoryFilters {
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
  hasExpiryDate?: boolean
  isExpired?: boolean
  isNearExpiry?: boolean
  hasSerialNumbers?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'createdAt' | 'movementDate' | 'quantity' | 'movementType'
  orderDirection?: 'ASC' | 'DESC'
  search?: string // Para busca em texto livre
}

// Interface para filtros de estoque atual
export interface StockFilters {
  productId?: string
  companyId?: string
  location?: string
  warehouseZone?: string
  isLowStock?: boolean
  isAtRiskOfStockout?: boolean
  isOutOfStock?: boolean
  needsReorder?: boolean
  abcClassification?: 'A' | 'B' | 'C'
  stockoutRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  hasExpiredItems?: boolean
  hasDamagedItems?: boolean
  minTotalQuantity?: number
  maxTotalQuantity?: number
  minAvailableQuantity?: number
  maxAvailableQuantity?: number
  page?: number
  pageSize?: number
  orderBy?: 'totalQuantity' | 'availableQuantity' | 'minStockLevel' | 'totalInvestment' | 'lastMovementDate'
  orderDirection?: 'ASC' | 'DESC'
  search?: string
}

// Interface para estatísticas de estoque
export interface InventoryStatistics {
  totalProducts: number
  totalQuantity: number
  totalValue: number
  totalInvestment: number
  lowStockProducts: number
  outOfStockProducts: number
  expiredProducts: number
  damagedProducts: number
  movementsByType: Record<MovementType, number>
  movementsByReason: Record<MovementReason, number>
  movementsByMonth: Record<string, number>
  topMovingProducts: Array<{
    productId: string
    productName: string
    totalMovements: number
    totalQuantity: number
  }>
  stockValueByLocation: Record<string, number>
  averageTurnoverRate: number
  stockoutIncidents: number
  inventoryAccuracy: number
}

// Interface para alertas de estoque
export interface StockAlert {
  id: string
  productId: string
  companyId: string
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'OVERSTOCK' | 'NO_MOVEMENT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  currentQuantity: number
  threshold: number
  message: string
  createdAt: Date
  acknowledged: boolean
  acknowledgedAt?: Date
  acknowledgedBy?: string
}

// Interface para o repository de inventory
export default interface IInventoryRepository {
  // === MOVEMENTS ===
  
  // Operations básicas para movements
  createMovement(inventory: Inventory): Promise<IResult<Inventory>>
  findMovementById(id: string): Promise<IResult<Inventory>>
  findMovementsByProduct(productId: string): Promise<IResult<Inventory[]>>
  findMovementsByCompany(companyId: string): Promise<IResult<Inventory[]>>
  
  // Operations de listagem com filtros e paginação
  findMovementsWithFilters(filters: InventoryFilters): Promise<IPaginationResult<Inventory>>
  
  // Operations de atualização
  updateMovement(id: string, inventory: Partial<Inventory>): Promise<IResult<Inventory>>
  confirmMovement(id: string, approvedBy: string): Promise<IResult<Inventory>>
  cancelMovement(id: string, cancelledBy: string, reason: string): Promise<IResult<Inventory>>
  
  // Operations de soft delete
  deleteMovement(id: string): Promise<IResult<void>>
  restoreMovement(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActiveMovements(): Promise<IResult<Inventory[]>>
  findAllMovements(page?: number, pageSize?: number): Promise<IPaginationResult<Inventory>>
  
  // Operations específicas para movements
  findMovementsByType(movementType: MovementType): Promise<IResult<Inventory[]>>
  findMovementsByReason(movementReason: MovementReason): Promise<IResult<Inventory[]>>
  findMovementsByDateRange(startDate: Date, endDate: Date): Promise<IResult<Inventory[]>>
  findPendingMovements(): Promise<IResult<Inventory[]>>
  findConfirmedMovements(): Promise<IResult<Inventory[]>>
  findExpiredProducts(): Promise<IResult<Inventory[]>>
  findNearExpiryProducts(daysAhead?: number): Promise<IResult<Inventory[]>>
  findMovementsByReference(referenceType: string, referenceId: string): Promise<IResult<Inventory[]>>
  
  // Operations de busca de texto
  searchMovements(searchTerm: string): Promise<IResult<Inventory[]>>
  
  // === STOCK ===
  
  // Operations básicas para stock
  createOrUpdateStock(stock: InventoryStock): Promise<IResult<InventoryStock>>
  findStockById(id: string): Promise<IResult<InventoryStock>>
  findStockByProduct(productId: string): Promise<IResult<InventoryStock>>
  findStocksByCompany(companyId: string): Promise<IResult<InventoryStock[]>>
  
  // Operations de listagem com filtros e paginação
  findStocksWithFilters(filters: StockFilters): Promise<IPaginationResult<InventoryStock>>
  
  // Operations de atualização
  updateStock(id: string, stock: Partial<InventoryStock>): Promise<IResult<InventoryStock>>
  reserveStock(productId: string, companyId: string, quantity: number): Promise<IResult<InventoryStock>>
  releaseStock(productId: string, companyId: string, quantity: number): Promise<IResult<InventoryStock>>
  confirmStockSale(productId: string, companyId: string, quantity: number): Promise<IResult<InventoryStock>>
  
  // Operations de listagem simplificadas
  findAllActiveStocks(): Promise<IResult<InventoryStock[]>>
  findAllStocks(page?: number, pageSize?: number): Promise<IPaginationResult<InventoryStock>>
  
  // Operations específicas para stock
  findLowStockProducts(): Promise<IResult<InventoryStock[]>>
  findOutOfStockProducts(): Promise<IResult<InventoryStock[]>>
  findAtRiskProducts(): Promise<IResult<InventoryStock[]>>
  findExpiredStock(): Promise<IResult<InventoryStock[]>>
  findDamagedStock(): Promise<IResult<InventoryStock[]>>
  findStocksByLocation(location: string): Promise<IResult<InventoryStock[]>>
  findStocksByWarehouseZone(zone: string): Promise<IResult<InventoryStock[]>>
  findStocksByABCClassification(abc: 'A' | 'B' | 'C'): Promise<IResult<InventoryStock[]>>
  
  // Operations de estatísticas
  getStatistics(startDate?: Date, endDate?: Date): Promise<IResult<InventoryStatistics>>
  getStockValue(companyId: string): Promise<number>
  getTotalQuantity(companyId: string): Promise<number>
  getLowStockCount(companyId: string): Promise<number>
  getOutOfStockCount(companyId: string): Promise<number>
  getMovementsByProduct(productId: string, days?: number): Promise<IResult<Inventory[]>>
  getTopMovingProducts(companyId: string, limit?: number): Promise<IResult<any[]>>
  getStockValuationByLocation(companyId: string): Promise<IResult<Record<string, number>>>
  
  // Operations para alertas
  generateStockAlerts(companyId: string): Promise<IResult<StockAlert[]>>
  getActiveAlerts(companyId: string): Promise<IResult<StockAlert[]>>
  acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<IResult<void>>
  dismissAlert(alertId: string): Promise<IResult<void>>
  
  // Operations para auditoria
  getMovementHistory(productId: string, limit?: number): Promise<IResult<Inventory[]>>
  getStockAuditTrail(productId: string, startDate?: Date, endDate?: Date): Promise<IResult<Inventory[]>>
  
  // Operations para reconciliação
  reconcileStock(productId: string, actualQuantity: number, countedBy: string): Promise<IResult<Inventory>>
  performCycleCount(products: string[], countedBy: string): Promise<IResult<any>>
  
  // Operations para forecasting
  getDemandForecast(productId: string, daysAhead?: number): Promise<IResult<any>>
  getReorderRecommendation(productId: string): Promise<IResult<any>>
  calculateEconomicOrderQuantity(productId: string): Promise<IResult<number>>
  
  // Operations para integrações
  updateStockFromSale(saleId: string, saleProducts: any[]): Promise<IResult<void>>
  updateStockFromPurchase(purchaseId: string, purchaseProducts: any[]): Promise<IResult<void>>
  
  // Operations para otimização
  bulkUpdateStockLevels(updates: Array<{productId: string, minStockLevel: number, maxStockLevel?: number}>): Promise<IResult<void>>
  optimizeStockLevels(companyId: string): Promise<IResult<any>>
  
  // Operations para contagem
  count(): Promise<number>
  countActive(): Promise<number>
  countByMovementType(movementType: MovementType): Promise<number>
  countByStatus(status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'): Promise<number>
  countLowStock(companyId: string): Promise<number>
  countOutOfStock(companyId: string): Promise<number>
  
  // Operations para relatórios avançados
  generateMovementReport(filters: InventoryFilters): Promise<IResult<any>>
  generateStockReport(filters: StockFilters): Promise<IResult<any>>
  generateABCAnalysis(companyId: string): Promise<IResult<any>>
  generateDeadStockReport(companyId: string): Promise<IResult<any>>
  generateSlowMovingReport(companyId: string, daysThreshold?: number): Promise<IResult<any>>
  
  // Operations para limpeza e manutenção
  cleanupOldMovements(daysOld?: number): Promise<IResult<number>>
  archiveCompletedMovements(): Promise<IResult<number>>
  optimizeIndexes(): Promise<IResult<void>>
  
  // Operations para configuração
  getInventoryConfiguration(): Promise<IResult<any>>
  updateInventoryConfiguration(config: any): Promise<IResult<void>>
}