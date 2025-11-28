import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

export enum SaleProductType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  DISCOUNT = 'DISCOUNT',
  TAX = 'TAX',
  SHIPPING = 'SHIPPING'
}

@Entity('sale_products')
export default class SaleProduct extends BaseEntity {

    @Column('uuid', { name: 'sale_id' })
    saleId: string

    @Column('uuid', { name: 'product_id', nullable: true })
    productId?: string

    @Column('uuid', { name: 'service_id', nullable: true })
    serviceId?: string

    // Dados do produto/serviço
    @Column({
        name: 'name',
        length: 255,
    })
    name: string

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description?: string

    @Column({
        name: 'sku',
        length: 50,
        nullable: true,
    })
    sku?: string

    @Column({
        name: 'product_type',
        length: 50,
        type: 'enum',
        enum: SaleProductType,
        default: SaleProductType.PRODUCT
    })
    productType: SaleProductType

    // Quantidades e preços
    @Column({
        name: 'quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        default: 1
    })
    quantity: number

    @Column({
        name: 'unit_price',
        type: 'decimal',
        precision: 15,
        scale: 2,
    })
    unitPrice: number

    @Column({
        name: 'cost_price',
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
    })
    costPrice?: number

    @Column({
        name: 'total_price',
        type: 'decimal',
        precision: 15,
        scale: 2,
        generated: true,
    })
    totalPrice: number

    @Column({
        name: 'total_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
        generated: true,
        default: 0
    })
    totalCost: number

    @Column({
        name: 'discount_value',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0
    })
    discountValue: number

    @Column({
        name: 'tax_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0
    })
    taxRate: number

    @Column({
        name: 'tax_value',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0
    })
    taxValue: number

    @Column({
        name: 'net_price',
        type: 'decimal',
        precision: 15,
        scale: 2,
        generated: true,
    })
    netPrice: number

    // Informações de estoque
    @Column({
        name: 'inventory_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
    })
    inventoryQuantity?: number

    @Column({
        name: 'reserved_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        default: 0
    })
    reservedQuantity: number

    @Column({
        name: 'available_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
    })
    availableQuantity?: number

    // Dimensões e peso (se aplicável)
    @Column({
        name: 'weight',
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    })
    weight?: number

    @Column({
        name: 'length',
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    })
    length?: number

    @Column({
        name: 'width',
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    })
    width?: number

    @Column({
        name: 'height',
        type: 'decimal',
        precision: 8,
        scale: 3,
        nullable: true,
    })
    height?: number

    // Informações de entrega
    @Column({
        name: 'delivery_date',
        type: 'timestamp with time zone',
        nullable: true,
    })
    deliveryDate?: Date

    @Column({
        name: 'tracking_code',
        length: 100,
        nullable: true,
    })
    trackingCode?: string

    // Observações
    @Column({
        name: 'notes',
        type: 'text',
        nullable: true,
    })
    notes?: string

    @Column({
        name: 'internal_notes',
        type: 'text',
        nullable: true,
    })
    internalNotes?: string

    constructor() {
        super()
    }

    // Factory method para criar novo item de venda
    static create(
        saleId: string,
        name: string,
        quantity: number,
        unitPrice: number,
        productType: SaleProductType = SaleProductType.PRODUCT,
        productId?: string,
        serviceId?: string,
        description?: string,
        sku?: string,
        costPrice?: number,
        taxRate: number = 0,
        deliveryDate?: Date,
        notes?: string
    ): SaleProduct {
        const saleProduct = new SaleProduct()
        saleProduct.saleId = saleId
        saleProduct.productId = productId
        saleProduct.serviceId = serviceId
        saleProduct.name = name
        saleProduct.description = description
        saleProduct.sku = sku
        saleProduct.productType = productType
        saleProduct.quantity = quantity
        saleProduct.unitPrice = unitPrice
        saleProduct.costPrice = costPrice
        saleProduct.taxRate = taxRate
        saleProduct.deliveryDate = deliveryDate
        saleProduct.notes = notes
        saleProduct.createdAt = new Date()

        saleProduct.calculateTotals()
        return saleProduct
    }

    // Método para atualizar item
    update(
        quantity?: number,
        unitPrice?: number,
        discountValue?: number,
        taxRate?: number,
        notes?: string,
        internalNotes?: string,
        deliveryDate?: Date,
        trackingCode?: string
    ): void {
        if (quantity !== undefined) this.quantity = quantity
        if (unitPrice !== undefined) this.unitPrice = unitPrice
        this.discountValue = discountValue || 0
        this.taxRate = taxRate || 0
        this.notes = notes || this.notes
        this.internalNotes = internalNotes || this.internalNotes
        this.deliveryDate = deliveryDate
        this.trackingCode = trackingCode
        this.updatedAt = new Date()

        this.calculateTotals()
    }

    // Calcular valores totais
    calculateTotals(): void {
        this.totalPrice = this.quantity * this.unitPrice
        this.totalCost = this.costPrice ? this.quantity * this.costPrice : 0
        this.taxValue = this.totalPrice * this.taxRate
        this.netPrice = this.totalPrice + this.taxValue - this.discountValue
    }

    // Verificar se é um produto físico
    isPhysicalProduct(): boolean {
        return this.productType === SaleProductType.PRODUCT && !!this.productId
    }

    // Verificar se é um serviço
    isService(): boolean {
        return this.productType === SaleProductType.SERVICE && !!this.serviceId
    }

    // Verificar se é um desconto
    isDiscount(): boolean {
        return this.productType === SaleProductType.DISCOUNT
    }

    // Verificar se é um imposto
    isTax(): boolean {
        return this.productType === SaleProductType.TAX
    }

    // Verificar se é frete
    isShipping(): boolean {
        return this.productType === SaleProductType.SHIPPING
    }

    // Verificar se tem estoque
    hasInventoryItem(): boolean {
        return this.isPhysicalProduct() && this.inventoryQuantity !== null
    }

    // Verificar se tem serviço
    hasServiceItem(): boolean {
        return this.isService()
    }

    // Verificar se o item pode ser editado
    canBeEdited(): boolean {
        return !this.isDiscount() && !this.isTax()
    }

    // Verificar se requer estoque
    requiresInventory(): boolean {
        return this.isPhysicalProduct() && !this.isService()
    }

    // Verificar se requer entrega
    requiresDelivery(): boolean {
        return this.isPhysicalProduct() && this.weight && this.weight > 0
    }

    // Calcular lucro do item
    calculateItemProfit(): number {
        return this.totalPrice - this.totalCost
    }

    // Calcular margem de lucro do item (%)
    calculateItemProfitMargin(): number {
        if (this.totalPrice === 0) return 0
        return ((this.calculateItemProfit() / this.totalPrice) * 100)
    }

    // Verificar se tem impostos
    hasTaxes(): boolean {
        return this.taxValue > 0
    }

    // Verificar se tem desconto
    hasDiscount(): boolean {
        return this.discountValue > 0
    }

    // Verificar se o estoque é suficiente
    hasSufficientInventory(requiredQuantity?: number): boolean {
        const qty = requiredQuantity || this.quantity
        return !this.requiresInventory() || 
               (this.inventoryQuantity !== null && this.inventoryQuantity >= qty)
    }

    // Verificar se precisa de reserva de estoque
    requiresInventoryReservation(): boolean {
        return this.requiresInventory() && !this.isService()
    }

    // Reservar estoque
    reserveInventory(quantity: number): boolean {
        if (!this.hasInventoryItem() || !this.hasSufficientInventory(quantity)) {
            return false
        }
        this.reservedQuantity += quantity
        this.availableQuantity = this.inventoryQuantity - this.reservedQuantity
        return true
    }

    // Liberar estoque reservado
    releaseReservedInventory(quantity: number): void {
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity)
        if (this.inventoryQuantity !== null) {
            this.availableQuantity = this.inventoryQuantity - this.reservedQuantity
        }
    }

    // Confirmar venda (mover reservado para vendido)
    confirmSale(quantity: number): void {
        if (this.hasInventoryItem()) {
            const soldQuantity = Math.min(quantity, this.reservedQuantity)
            this.reservedQuantity -= soldQuantity
            if (this.inventoryQuantity !== null) {
                this.inventoryQuantity -= soldQuantity
                this.availableQuantity = this.inventoryQuantity - this.reservedQuantity
            }
        }
    }

    // Cancelar venda (retornar estoque reservado)
    cancelSale(quantity: number): void {
        this.releaseReservedInventory(quantity)
    }

    // Verificar se todos os dados obrigatórios estão preenchidos
    isValid(): boolean {
        return !!(
            this.saleId &&
            this.name &&
            this.quantity > 0 &&
            this.unitPrice >= 0 &&
            this.productType
        )
    }

    // Verificar se o item está ativo
    isActive(): boolean {
        return !this.isDeleted
    }

    // Verificar se o item está entregue
    isDelivered(): boolean {
        return this.deliveryDate ? this.deliveryDate <= new Date() : false
    }

    // Verificar se está atrasado
    isOverdue(): boolean {
        return this.deliveryDate ? this.deliveryDate < new Date() : false
    }

    // Obter resumo do item para relatórios
    getSummary(): object {
        return {
            id: this.id,
            name: this.name,
            sku: this.sku,
            productType: this.productType,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            totalCost: this.totalCost,
            profit: this.calculateItemProfit(),
            profitMargin: this.calculateItemProfitMargin(),
            taxValue: this.taxValue,
            discountValue: this.discountValue,
            netPrice: this.netPrice,
            isPhysicalProduct: this.isPhysicalProduct(),
            isService: this.isService(),
            hasTaxes: this.hasTaxes(),
            hasDiscount: this.hasDiscount(),
            requiresInventory: this.requiresInventory(),
            requiresDelivery: this.requiresDelivery(),
            isDelivered: this.isDelivered(),
            isOverdue: this.isOverdue(),
            hasSufficientInventory: this.hasSufficientInventory(),
            isActive: this.isActive()
        }
    }

    // Método para soft delete
    delete(): void {
        this.isDeleted = true
        this.deletedAt = new Date()
    }

    // Método para restaurar item deletado
    restore(): void {
        this.isDeleted = false
        this.deletedAt = undefined
    }
}