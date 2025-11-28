import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

@Entity('inventory_stock')
export class InventoryStock extends BaseEntity {
  
    @Column({ name: 'product_id' })
    productId: string

    @Column({ name: 'company_id' })
    companyId: string

    @Column({ name: 'total_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    totalQuantity: number

    @Column({ name: 'reserved_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    reservedQuantity: number

    @Column({ name: 'available_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    availableQuantity: number

    @Column({ name: 'damaged_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    damagedQuantity: number

    @Column({ name: 'expired_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    expiredQuantity: number

    @Column({ name: 'quarantine_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
    quarantineQuantity: number

    @Column({ name: 'min_stock_level', type: 'decimal', precision: 10, scale: 3, default: 0 })
    minStockLevel: number

    @Column({ name: 'max_stock_level', type: 'decimal', precision: 10, scale: 3, nullable: true })
    maxStockLevel?: number

    @Column({ name: 'reorder_point', type: 'decimal', precision: 10, scale: 3, default: 0 })
    reorderPoint: number

    @Column({ name: 'safety_stock', type: 'decimal', precision: 10, scale: 3, default: 0 })
    safetyStock: number

    @Column({ name: 'avg_unit_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
    avgUnitCost: number

    @Column({ name: 'total_investment', type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalInvestment: number

    @Column({ name: 'last_movement_date', type: 'timestamp with time zone', nullable: true })
    lastMovementDate?: Date

    @Column({ name: 'last_purchase_date', type: 'timestamp with time zone', nullable: true })
    lastPurchaseDate?: Date

    @Column({ name: 'last_sale_date', type: 'timestamp with time zone', nullable: true })
    lastSaleDate?: Date

    @Column({ name: 'stock_valuation_method', length: 20, default: 'FIFO' })
    stockValuationMethod: 'FIFO' | 'LIFO' | 'AVERAGE' | 'STANDARD'

    @Column({ name: 'location', length: 100, nullable: true })
    location?: string

    @Column({ name: 'warehouse_zone', length: 50, nullable: true })
    warehouseZone?: string

    @Column({ name: 'abc_classification', length: 1, nullable: true })
    abcClassification?: 'A' | 'B' | 'C'

    @Column({ name: 'lead_time_days', type: 'integer', default: 0 })
    leadTimeDays: number

    @Column({ name: 'stockout_risk_level', type: 'enum', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' })
    stockoutRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

    @Column({ name: 'days_of_supply', type: 'decimal', precision: 10, scale: 2, nullable: true })
    daysOfSupply?: number

    @Column({ name: 'turnover_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
    turnoverRate?: number

    @Column({ name: 'last_count_date', type: 'date', nullable: true })
    lastCountDate?: Date

    @Column({ name: 'next_count_date', type: 'date', nullable: true })
    nextCountDate?: Date

    @Column({ name: 'count_variance', type: 'decimal', precision: 10, scale: 3, default: 0 })
    countVariance: number

    @Column({ name: 'is_tracked', type: 'boolean', default: true })
    isTracked: boolean

    @Column({ name: 'allow_negative_stock', type: 'boolean', default: false })
    allowNegativeStock: boolean

    @Column({ name: 'auto_reorder_enabled', type: 'boolean', default: false })
    autoReorderEnabled: boolean

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string

    constructor() {
        super()
    }

    // Factory method para criar estoque inicial
    static create(
        productId: string,
        companyId: string,
        initialQuantity = 0,
        minStockLevel = 0,
        location?: string
    ): InventoryStock {
        const stock = new InventoryStock()
        stock.productId = productId
        stock.companyId = companyId
        stock.totalQuantity = initialQuantity
        stock.availableQuantity = initialQuantity
        stock.reservedQuantity = 0
        stock.minStockLevel = minStockLevel
        stock.reorderPoint = minStockLevel
        stock.safetyStock = 0
        stock.stockValuationMethod = 'FIFO'
        stock.isTracked = true
        stock.allowNegativeStock = false
        stock.autoReorderEnabled = false
        stock.location = location
        stock.createdAt = new Date()
        return stock
    }

    // Métodos de negócio

    // Verificar se o estoque está baixo
    isLowStock(): boolean {
        return this.availableQuantity <= this.minStockLevel
    }

    // Verificar se está em risco de falta
    isAtRiskOfStockout(): boolean {
        return this.availableQuantity <= this.reorderPoint
    }

    // Verificar se está em situação crítica
    isCriticalStock(): boolean {
        return this.availableQuantity <= this.safetyStock
    }

    // Verificar se está sem estoque
    isOutOfStock(): boolean {
        return this.availableQuantity <= 0
    }

    // Verificar se tem estoque suficiente
    hasSufficientStock(requiredQuantity: number): boolean {
        return this.availableQuantity >= requiredQuantity
    }

    // Reservar quantidade
    reserve(quantity: number): boolean {
        if (this.availableQuantity >= quantity) {
            this.availableQuantity -= quantity
            this.reservedQuantity += quantity
            this.updatedAt = new Date()
            return true
        }
        return false
    }

    // Liberar reserva
    release(quantity: number): void {
        const releaseAmount = Math.min(quantity, this.reservedQuantity)
        this.reservedQuantity -= releaseAmount
        this.availableQuantity += releaseAmount
        this.updatedAt = new Date()
    }

    // Confirmar venda (mover reservado para vendido)
    confirmSale(quantity: number): boolean {
        const confirmAmount = Math.min(quantity, this.reservedQuantity)
        if (confirmAmount > 0) {
            this.reservedQuantity -= confirmAmount
            this.totalQuantity -= confirmAmount
            this.availableQuantity = this.totalQuantity - this.reservedQuantity
            this.updatedAt = new Date()
            return true
        }
        return false
    }

    // Adicionar estoque
    addStock(quantity: number, unitCost?: number): void {
        this.totalQuantity += quantity
        this.availableQuantity += quantity

        // Atualizar custo médio se fornecido
        if (unitCost !== undefined) {
            this.updateAverageCost(unitCost, quantity)
        }

        this.updatedAt = new Date()
    }

    // Remover estoque
    removeStock(quantity: number): boolean {
        if (this.allowNegativeStock || this.availableQuantity >= quantity) {
            this.totalQuantity -= quantity
            this.availableQuantity = this.totalQuantity - this.reservedQuantity
            this.updatedAt = new Date()
            return true
        }
        return false
    }

    // Ajustar estoque
    adjustStock(adjustmentQuantity: number, reason?: string): void {
        this.totalQuantity += adjustmentQuantity
        this.availableQuantity = this.totalQuantity - this.reservedQuantity
        
        if (reason === 'DAMAGE') {
            const damagedAmount = Math.max(0, adjustmentQuantity)
            this.damagedQuantity += damagedAmount
        } else if (reason === 'EXPIRED') {
            const expiredAmount = Math.max(0, adjustmentQuantity)
            this.expiredQuantity += expiredAmount
        }
        
        this.updatedAt = new Date()
    }

    // Atualizar custo médio
    private updateAverageCost(newUnitCost: number, newQuantity: number): void {
        if (this.totalQuantity === 0) {
            this.avgUnitCost = newUnitCost
        } else {
            const totalValue = (this.totalQuantity * this.avgUnitCost) + (newQuantity * newUnitCost)
            const newTotalQuantity = this.totalQuantity + newQuantity
            this.avgUnitCost = totalValue / newTotalQuantity
        }
        
        this.totalInvestment = this.totalQuantity * this.avgUnitCost
    }

    // Calcular dias de suprimento
    calculateDaysOfSupply(dailyDemand: number): number {
        if (dailyDemand <= 0) return 0
        return this.availableQuantity / dailyDemand
    }

    // Calcular taxa de rotação
    calculateTurnoverRate(periodDays: number, salesQuantity: number): number {
        if (periodDays <= 0) return 0
        const averageStock = this.totalQuantity // Simplificação
        if (averageStock <= 0) return 0
        return (salesQuantity / averageStock) * (365 / periodDays)
    }

    // Atualizar nível de risco
    updateRiskLevel(): void {
        if (this.isOutOfStock()) {
            this.stockoutRiskLevel = 'CRITICAL'
        } else if (this.isCriticalStock()) {
            this.stockoutRiskLevel = 'HIGH'
        } else if (this.isAtRiskOfStockout()) {
            this.stockoutRiskLevel = 'MEDIUM'
        } else {
            this.stockoutRiskLevel = 'LOW'
        }
    }

    // Verificar se precisa de reposição
    needsReorder(): boolean {
        return this.availableQuantity <= this.reorderPoint && this.autoReorderEnabled
    }

    // Obter status do estoque
    getStockStatus(): {
        status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'NORMAL' | 'OVERSTOCKED'
        level: number
        percentage: number
    } {
        let status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'NORMAL' | 'OVERSTOCKED'
        let level = 0
        
        if (this.isOutOfStock()) {
            status = 'OUT_OF_STOCK'
            level = 0
        } else if (this.isCriticalStock()) {
            status = 'CRITICAL'
            level = 25
        } else if (this.isLowStock()) {
            status = 'LOW'
            level = 50
        } else if (this.maxStockLevel && this.totalQuantity > this.maxStockLevel) {
            status = 'OVERSTOCKED'
            level = 100
        } else {
            status = 'NORMAL'
            level = 75
        }

        const percentage = this.maxStockLevel 
            ? Math.min((this.totalQuantity / this.maxStockLevel) * 100, 100)
            : Math.min((this.totalQuantity / Math.max(this.minStockLevel * 2, 10)) * 100, 100)

        return { status, level, percentage }
    }

    // Verificar se os dados são válidos
    isValid(): boolean {
        return !!(
            this.productId &&
            this.companyId &&
            this.totalQuantity >= 0 &&
            this.reservedQuantity >= 0 &&
            this.availableQuantity >= 0 &&
            this.minStockLevel >= 0 &&
            this.reorderPoint >= 0
        )
    }

    // Verificar se está ativo
    isActive(): boolean {
        return !this.isDeleted
    }

    // Método para soft delete
    delete(): void {
        this.isDeleted = true
        this.deletedAt = new Date()
    }

    // Método para restaurar
    restore(): void {
        this.isDeleted = false
        this.deletedAt = undefined
    }

    // Obter resumo para relatórios
    getSummary(): object {
        const stockStatus = this.getStockStatus()
        return {
            id: this.id,
            productId: this.productId,
            companyId: this.companyId,
            totalQuantity: this.totalQuantity,
            reservedQuantity: this.reservedQuantity,
            availableQuantity: this.availableQuantity,
            damagedQuantity: this.damagedQuantity,
            expiredQuantity: this.expiredQuantity,
            minStockLevel: this.minStockLevel,
            maxStockLevel: this.maxStockLevel,
            reorderPoint: this.reorderPoint,
            safetyStock: this.safetyStock,
            avgUnitCost: this.avgUnitCost,
            totalInvestment: this.totalInvestment,
            location: this.location,
            warehouseZone: this.warehouseZone,
            abcClassification: this.abcClassification,
            stockStatus: stockStatus.status,
            stockLevel: stockStatus.level,
            stockPercentage: stockStatus.percentage,
            isLowStock: this.isLowStock(),
            isAtRiskOfStockout: this.isAtRiskOfStockout(),
            isCriticalStock: this.isCriticalStock(),
            isOutOfStock: this.isOutOfStock(),
            needsReorder: this.needsReorder(),
            lastMovementDate: this.lastMovementDate,
            isActive: this.isActive(),
            createdAt: this.createdAt
        }
    }
}

export default InventoryStock