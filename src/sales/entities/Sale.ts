import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

export enum SaleStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED'
}

export enum SaleType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  CONSIGNMENT = 'CONSIGNMENT',
  SERVICE = 'SERVICE'
}

export enum PaymentType {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_SLIP = 'BANK_SLIP',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  FINANCED = 'FINANCED',
  INSTALLMENTS = 'INSTALLMENTS',
  EXCHANGE = 'EXCHANGE',
  CREDIT = 'CREDIT'
}

@Entity('sales')
export default class Sale extends BaseEntity {

    @Column('uuid', { name: 'customer_id' })
    customerId: string

    @Column('uuid', { name: 'company_id' })
    companyId: string

    @Column({
        name: 'sale_number',
        length: 50,
        unique: true,
    })
    saleNumber: string

    @Column({
        name: 'sale_type',
        length: 50,
        type: 'enum',
        enum: SaleType,
        default: SaleType.RETAIL
    })
    saleType: SaleType

    @Column({
        name: 'payment_type',
        length: 50,
        type: 'enum',
        enum: PaymentType,
        default: PaymentType.CASH
    })
    paymentType: PaymentType

    @Column({
        name: 'status',
        length: 50,
        type: 'enum',
        enum: SaleStatus,
        default: SaleStatus.PENDING
    })
    status: SaleStatus

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0
    })
    totalAmount: number

    @Column({
        name: 'total_cost',
        type: 'decimal',
        precision: 15,
        scale: 2,
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
        name: 'tax_value',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0
    })
    taxValue: number

    @Column({
        name: 'shipping_value',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0
    })
    shippingValue: number

    @Column({
        name: 'net_amount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        generated: true,
        default: 0
    })
    netAmount: number

    @Column({
        name: 'customer_address',
        type: 'json',
        nullable: true,
    })
    customerAddress?: any

    @Column({
        name: 'sale_date',
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP'
    })
    saleDate: Date

    @Column({
        name: 'payment_due_date',
        type: 'timestamp with time zone',
        nullable: true,
    })
    paymentDueDate?: Date

    @Column({
        name: 'delivery_date',
        type: 'timestamp with time zone',
        nullable: true,
    })
    deliveryDate?: Date

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

    @Column({
        name: 'payment_installments',
        type: 'integer',
        default: 1
    })
    paymentInstallments: number

    @Column({
        name: 'delivery_method',
        length: 100,
        nullable: true,
    })
    deliveryMethod?: string

    @Column({
        name: 'tracking_code',
        length: 100,
        nullable: true,
    })
    trackingCode?: string

    constructor() {
        super()
    }

    static create(
        customerId: string,
        companyId: string,
        saleType: SaleType,
        paymentType: PaymentType,
        totalAmount: number,
        saleDate?: Date,
        paymentDueDate?: Date,
        deliveryDate?: Date,
        notes?: string,
        internalNotes?: string,
        paymentInstallments: number = 1,
        deliveryMethod?: string
    ): Sale {
        const sale = new Sale()
        sale.customerId = customerId
        sale.companyId = companyId
        sale.saleNumber = Sale.generateSaleNumber()
        sale.saleType = saleType
        sale.paymentType = paymentType
        sale.status = SaleStatus.PENDING
        sale.totalAmount = totalAmount
        sale.saleDate = saleDate || new Date()
        sale.paymentDueDate = paymentDueDate
        sale.deliveryDate = deliveryDate
        sale.notes = notes
        sale.internalNotes = internalNotes
        sale.paymentInstallments = paymentInstallments
        sale.deliveryMethod = deliveryMethod
        sale.createdAt = new Date()
        
        sale.calculateNetAmount()
        return sale
    }

    update(
        totalAmount: number,
        discountValue?: number,
        taxValue?: number,
        shippingValue?: number,
        status?: SaleStatus,
        notes?: string,
        internalNotes?: string,
        paymentDueDate?: Date,
        deliveryDate?: Date,
        trackingCode?: string
    ): void {
        this.totalAmount = totalAmount
        this.discountValue = discountValue || 0
        this.taxValue = taxValue || 0
        this.shippingValue = shippingValue || 0
        this.status = status || this.status
        this.notes = notes || this.notes
        this.internalNotes = internalNotes || this.internalNotes
        this.paymentDueDate = paymentDueDate
        this.deliveryDate = deliveryDate
        this.trackingCode = trackingCode
        this.updatedAt = new Date()
        
        this.calculateNetAmount()
    }

    isActive(): boolean {
        return !this.isDeleted
    }

    canBeEdited(): boolean {
        return this.status === SaleStatus.PENDING || this.status === SaleStatus.CONFIRMED
    }

    canBeCancelled(): boolean {
        return ![SaleStatus.CANCELLED, SaleStatus.REFUNDED, SaleStatus.RETURNED].includes(this.status)
    }

    isPendingPayment(): boolean {
        return this.status === SaleStatus.CONFIRMED && this.paymentDueDate && this.paymentDueDate < new Date()
    }

    isCompleted(): boolean {
        return this.status === SaleStatus.COMPLETED
    }

    isCancelled(): boolean {
        return this.status === SaleStatus.CANCELLED
    }

    isRefunded(): boolean {
        return this.status === SaleStatus.REFUNDED
    }

    isReturned(): boolean {
        return this.status === SaleStatus.RETURNED
    }

    calculateNetAmount(): void {
        this.netAmount = this.totalAmount + this.taxValue + this.shippingValue - this.discountValue
    }

    calculateProfit(): number {
        return this.totalAmount - this.totalCost
    }

    calculateProfitMargin(): number {
        if (this.totalAmount === 0) return 0
        return ((this.calculateProfit() / this.totalAmount) * 100)
    }

    isCreditSale(): boolean {
        return [PaymentType.FINANCED, PaymentType.INSTALLMENTS, PaymentType.CREDIT].includes(this.paymentType)
    }

    isCashSale(): boolean {
        return [PaymentType.CASH, PaymentType.CREDIT_CARD, PaymentType.DEBIT_CARD, PaymentType.PIX].includes(this.paymentType)
    }

    delete(): void {
        this.isDeleted = true
        this.deletedAt = new Date()
    }

    restore(): void {
        this.isDeleted = false
        this.deletedAt = undefined
    }

    isValid(): boolean {
        return !!(
            this.customerId &&
            this.companyId &&
            this.saleNumber &&
            this.saleType &&
            this.paymentType &&
            this.totalAmount > 0
        )
    }

    static generateSaleNumber(): string {
        const now = new Date()
        const day = now.getDate().toString().padStart(2, '0')
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const year = now.getFullYear()
        const timestamp = now.getTime().toString().slice(-6)
        
        return `V${day}${month}${year}-${timestamp}`
    }

    getDaysSinceSale(): number {
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - this.saleDate.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    getDaysUntilDueDate(): number {
        if (!this.paymentDueDate) return 0
        const now = new Date()
        const diffTime = this.paymentDueDate.getTime() - now.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    isOverdue(): boolean {
        return this.isPendingPayment() && this.getDaysUntilDueDate() < 0
    }

    isDueSoon(): boolean {
        const daysUntilDue = this.getDaysUntilDueDate()
        return this.isPendingPayment() && daysUntilDue >= 0 && daysUntilDue <= 3
    }

    getSummary(): object {
        return {
            id: this.id,
            saleNumber: this.saleNumber,
            status: this.status,
            saleType: this.saleType,
            paymentType: this.paymentType,
            totalAmount: this.totalAmount,
            netAmount: this.netAmount,
            profit: this.calculateProfit(),
            profitMargin: this.calculateProfitMargin(),
            daysSinceSale: this.getDaysSinceSale(),
            isCreditSale: this.isCreditSale(),
            isCashSale: this.isCashSale(),
            isOverdue: this.isOverdue(),
            isDueSoon: this.isDueSoon(),
            isActive: this.isActive()
        }
    }
}