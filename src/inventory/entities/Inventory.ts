import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { MovementType, MovementReason } from '../enums/InventoryEnums'

@Entity('inventory_movements')
export class Inventory extends BaseEntity {
  
    @Column({ name: 'product_id' })
    productId: string

    @Column({ name: 'company_id' })
    companyId: string

    @Column({ name: 'user_id' })
    userId: string

    @Column({
        name: 'movement_type',
        type: 'enum',
        enum: MovementType
    })
    movementType: MovementType

    @Column({
        name: 'movement_reason',
        type: 'enum',
        enum: MovementReason
    })
    movementReason: MovementReason

    @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 3 })
    quantity: number

    @Column({ name: 'previous_quantity', type: 'decimal', precision: 10, scale: 3 })
    previousQuantity: number

    @Column({ name: 'current_quantity', type: 'decimal', precision: 10, scale: 3 })
    currentQuantity: number

    @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 2, nullable: true })
    unitCost?: number

    @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, nullable: true })
    totalCost?: number

    @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
    unitPrice?: number

    @Column({ name: 'total_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
    totalPrice?: number

    @Column({ name: 'reference_id', nullable: true })
    referenceId?: string // ID da venda, compra, etc.

    @Column({ name: 'reference_type', length: 50, nullable: true })
    referenceType?: string // Tipo da referência: 'sale', 'purchase', 'adjustment', etc.

    @Column({ name: 'reference_number', length: 100, nullable: true })
    referenceNumber?: string // Número da referência

    @Column({
        name: 'status',
        type: 'enum',
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        default: 'CONFIRMED'
    })
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'

    @Column({ name: 'batch_number', length: 100, nullable: true })
    batchNumber?: string

    @Column({ name: 'expiry_date', type: 'date', nullable: true })
    expiryDate?: Date

    @Column({ name: 'serial_numbers', type: 'json', nullable: true })
    serialNumbers?: string[] // Para produtos seriais

    @Column({ name: 'location', length: 100, nullable: true })
    location?: string // Localização do estoque

    @Column({ name: 'warehouse_zone', length: 50, nullable: true })
    warehouseZone?: string // Zona do depósito

    @Column({ name: 'supplier_id', nullable: true })
    supplierId?: string

    @Column({ name: 'customer_id', nullable: true })
    customerId?: string

    @Column({ name: 'sale_id', nullable: true })
    saleId?: string

    @Column({ name: 'purchase_order_id', nullable: true })
    purchaseOrderId?: string

    @Column({
        name: 'quality_status',
        type: 'enum',
        enum: ['GOOD', 'DAMAGED', 'EXPIRED', 'DEFECTIVE', 'QUARANTINE'],
        default: 'GOOD'
    })
    qualityStatus: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'DEFECTIVE' | 'QUARANTINE'

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string

    @Column({ name: 'internal_notes', type: 'text', nullable: true })
    internalNotes?: string

    @Column({ name: 'attachment_url', length: 500, nullable: true })
    attachmentUrl?: string // URL do documento comprobatório

    @Column({ name: 'approved_by', nullable: true })
    approvedBy?: string

    @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
    approvedAt?: Date

    @Column({ name: 'cancelled_by', nullable: true })
    cancelledBy?: string

    @Column({ name: 'cancelled_at', type: 'timestamp with time zone', nullable: true })
    cancelledAt?: Date

    @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
    cancellationReason?: string

    constructor() {
        super()
    }

    // Factory method para criar movimento de estoque
    static create(
        productId: string,
        companyId: string,
        userId: string,
        movementType: MovementType,
        movementReason: MovementReason,
        quantity: number,
        previousQuantity: number,
        referenceId?: string,
        referenceType?: string,
        referenceNumber?: string,
        unitCost?: number,
        unitPrice?: number,
        location?: string,
        warehouseZone?: string,
        notes?: string
    ): Inventory {
        const inventory = new Inventory()
        inventory.productId = productId
        inventory.companyId = companyId
        inventory.userId = userId
        inventory.movementType = movementType
        inventory.movementReason = movementReason
        inventory.quantity = quantity
        inventory.previousQuantity = previousQuantity
        inventory.currentQuantity = previousQuantity + (movementType === MovementType.IN ? quantity : -quantity)
        inventory.referenceId = referenceId
        inventory.referenceType = referenceType
        inventory.referenceNumber = referenceNumber
        inventory.unitCost = unitCost
        inventory.unitPrice = unitPrice
        inventory.location = location
        inventory.warehouseZone = warehouseZone
        inventory.notes = notes
        inventory.createdAt = new Date()

        // Calcular valores totais
        if (unitCost) {
            inventory.totalCost = quantity * unitCost
        }
        if (unitPrice) {
            inventory.totalPrice = quantity * unitPrice
        }

        return inventory
    }

    // Métodos de negócio

    // Verificar se é entrada de estoque
    isEntry(): boolean {
        return this.movementType === MovementType.IN
    }

    // Verificar se é saída de estoque
    isExit(): boolean {
        return this.movementType === MovementType.OUT
    }

    // Verificar se o movimento está pendente
    isPending(): boolean {
        return this.status === 'PENDING'
    }

    // Verificar se o movimento está confirmado
    isConfirmed(): boolean {
        return this.status === 'CONFIRMED'
    }

    // Verificar se o movimento está cancelado
    isCancelled(): boolean {
        return this.status === 'CANCELLED'
    }

    // Verificar se é movimento de venda
    isSale(): boolean {
        return this.movementReason === MovementReason.SALE
    }

    // Verificar se é movimento de compra
    isPurchase(): boolean {
        return this.movementReason === MovementReason.PURCHASE
    }

    // Verificar se é ajuste
    isAdjustment(): boolean {
        return this.movementReason === MovementReason.ADJUSTMENT_POSITIVE || 
               this.movementReason === MovementReason.ADJUSTMENT_NEGATIVE
    }

    // Verificar se o produto está expirado
    isExpired(): boolean {
        if (!this.expiryDate) return false
        return new Date() > this.expiryDate
    }

    // Verificar se o produto está próximo do vencimento (30 dias)
    isNearExpiry(): boolean {
        if (!this.expiryDate) return false
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return this.expiryDate <= thirtyDaysFromNow
    }

    // Verificar se o produto tem qualidade boa
    isGoodQuality(): boolean {
        return this.qualityStatus === 'GOOD'
    }

    // Calcular o valor total do movimento
    calculateTotalValue(): number {
        if (this.unitPrice && this.quantity) {
            return this.quantity * this.unitPrice
        }
        if (this.totalPrice) {
            return this.totalPrice
        }
        return 0
    }

    // Calcular o custo total do movimento
    calculateTotalCost(): number {
        if (this.unitCost && this.quantity) {
            return this.quantity * this.unitCost
        }
        if (this.totalCost) {
            return this.totalCost
        }
        return 0
    }

    // Confirmar o movimento
    confirm(approvedBy: string): void {
        if (this.status !== 'PENDING') {
            throw new Error('Only pending movements can be confirmed')
        }
        this.status = 'CONFIRMED'
        this.approvedBy = approvedBy
        this.approvedAt = new Date()
        this.updatedAt = new Date()
    }

    // Cancelar o movimento
    cancel(cancelledBy: string, reason: string): void {
        if (this.status === 'CANCELLED') {
            throw new Error('Movement is already cancelled')
        }
        this.status = 'CANCELLED'
        this.cancelledBy = cancelledBy
        this.cancelledAt = new Date()
        this.cancellationReason = reason
        this.updatedAt = new Date()
    }

    // Verificar se o movimento pode ser editado
    canBeEdited(): boolean {
        return this.status === 'PENDING'
    }

    // Verificar se o movimento pode ser cancelado
    canBeCancelled(): boolean {
        return this.status !== 'CANCELLED'
    }

    // Verificar se todos os dados são válidos
    isValid(): boolean {
        return !!(
            this.productId &&
            this.companyId &&
            this.userId &&
            this.movementType &&
            this.movementReason &&
            this.quantity > 0 &&
            this.previousQuantity >= 0 &&
            this.currentQuantity >= 0
        )
    }

    // Verificar se o movimento está ativo
    isActive(): boolean {
        return !this.isDeleted && this.status !== 'CANCELLED'
    }

    // Método para soft delete
    delete(): void {
        this.isDeleted = true
        this.deletedAt = new Date()
    }

    // Método para restaurar movimento deletado
    restore(): void {
        this.isDeleted = false
        this.deletedAt = undefined
    }

    // Obter resumo do movimento para relatórios
    getSummary(): object {
        return {
            id: this.id,
            productId: this.productId,
            companyId: this.companyId,
            movementType: this.movementType,
            movementReason: this.movementReason,
            quantity: this.quantity,
            previousQuantity: this.previousQuantity,
            currentQuantity: this.currentQuantity,
            unitCost: this.unitCost,
            totalCost: this.totalCost,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            referenceType: this.referenceType,
            referenceNumber: this.referenceNumber,
            status: this.status,
            location: this.location,
            warehouseZone: this.warehouseZone,
            qualityStatus: this.qualityStatus,
            isEntry: this.isEntry(),
            isExit: this.isExit(),
            isSale: this.isSale(),
            isPurchase: this.isPurchase(),
            isAdjustment: this.isAdjustment(),
            isExpired: this.isExpired(),
            isNearExpiry: this.isNearExpiry(),
            isGoodQuality: this.isGoodQuality(),
            totalValue: this.calculateTotalValue(),
            totalCost: this.calculateTotalCost(),
            isActive: this.isActive(),
            createdAt: this.createdAt
        }
    }

    // Atualizar localização
    updateLocation(location: string, warehouseZone?: string): void {
        this.location = location
        this.warehouseZone = warehouseZone
        this.updatedAt = new Date()
    }

    // Atualizar qualidade
    updateQualityStatus(qualityStatus: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'DEFECTIVE' | 'QUARANTINE'): void {
        this.qualityStatus = qualityStatus
        this.updatedAt = new Date()
    }

    // Adicionar números de série
    addSerialNumbers(serialNumbers: string[]): void {
        if (!this.serialNumbers) {
            this.serialNumbers = []
        }
        this.serialNumbers.push(...serialNumbers)
        this.updatedAt = new Date()
    }

    // Remover números de série
    removeSerialNumbers(serialNumbers: string[]): void {
        if (this.serialNumbers) {
            this.serialNumbers = this.serialNumbers.filter(sn => !serialNumbers.includes(sn))
            this.updatedAt = new Date()
        }
    }
}

export default Inventory