import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import ProductDimensions from '../valueObjects/ProductDimensions'
import ProductWeight from '../valueObjects/ProductWeight'
import ProductImage from '../valueObjects/ProductImage'
import Category from '../../categories/entities/Category'
import Company from '../../companies/entities/Company'

@Entity('products')
export class Product extends BaseEntity {

  @Column({
    length: 255,
  })
  name: string

  @Column({
    name: 'description',
    type: 'text',
  })
  description: string

  @Column({
    name: 'short_description',
    length: 500,
  })
  shortDescription: string

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  costPrice?: number

  // Store as JSON in database
  @Column({
    name: 'dimensions',
    type: 'json',
    nullable: true,
  })
  dimensions?: ProductDimensions

  // Store as JSON in database  
  @Column({
    name: 'weight',
    type: 'json',
    nullable: true,
  })
  weight?: ProductWeight

  // Store as JSON array in database
  @Column({
    name: 'images',
    type: 'json',
    nullable: true,
  })
  images?: ProductImage[]

  @Column({
    name: 'sku',
    length: 100,
    nullable: true,
    unique: true,
  })
  sku?: string

  @Column({
    name: 'barcode',
    length: 50,
    nullable: true,
    unique: true,
  })
  barcode?: string

  @Column({
    name: 'stock_quantity',
    type: 'integer',
    default: 0,
  })
  stockQuantity: number

  @Column({
    name: 'min_stock_level',
    type: 'integer',
    default: 0,
  })
  minStockLevel: number

  @Column({
    name: 'max_stock_level',
    type: 'integer',
    nullable: true,
  })
  maxStockLevel?: number

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
  })
  isFeatured: boolean

  @Column({
    name: 'is_digital',
    type: 'boolean',
    default: false,
  })
  isDigital: boolean

  // SEO fields
  @Column({
    name: 'slug',
    length: 255,
    nullable: true,
    unique: true,
  })
  slug?: string

  @Column({
    name: 'meta_title',
    length: 255,
    nullable: true,
  })
  metaTitle?: string

  @Column({
    name: 'meta_description',
    type: 'text',
    nullable: true,
  })
  metaDescription?: string

  // Relationships
  @Column({
    name: 'id_category',
    type: 'uuid',
    nullable: true,
  })
  categoryId?: string

  @ManyToOne(() => Category, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'id_category' })
  category?: Category

  @Column({
    name: 'id_company',
    type: 'uuid',
    nullable: false,
  })
  companyId: string

  @ManyToOne(() => Company, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id_company' })
  company: Company

  // Stock management
  @Column({
    name: 'reserved_quantity',
    type: 'integer',
    default: 0,
  })
  reservedQuantity: number

  @Column({
    name: 'available_quantity',
    type: 'integer',
    default: 0,
  })
  availableQuantity: number

  constructor() {
    super()
  }

  // Factory method para criar um novo Product
  static create(
    name: string,
    description: string,
    shortDescription: string,
    price: number,
    companyId: string,
    categoryId?: string,
    costPrice?: number,
    sku?: string,
    barcode?: string,
    stockQuantity: number = 0,
    minStockLevel: number = 0,
    maxStockLevel?: number,
    dimensions?: ProductDimensions,
    weight?: ProductWeight,
    images?: ProductImage[],
    isActive: boolean = true,
    isFeatured: boolean = false,
    isDigital: boolean = false,
    slug?: string,
    metaTitle?: string,
    metaDescription?: string
  ): Product {
    const product = new Product()
    product.name = name
    product.description = description
    product.shortDescription = shortDescription
    product.price = price
    product.companyId = companyId
    product.categoryId = categoryId
    product.costPrice = costPrice
    product.sku = sku
    product.barcode = barcode
    product.stockQuantity = stockQuantity
    product.minStockLevel = minStockLevel
    product.maxStockLevel = maxStockLevel
    product.dimensions = dimensions
    product.weight = weight
    product.images = images
    product.isActive = isActive
    product.isFeatured = isFeatured
    product.isDigital = isDigital
    product.slug = slug || this.generateSlug(name)
    product.metaTitle = metaTitle
    product.metaDescription = metaDescription
    product.availableQuantity = stockQuantity
    product.createdAt = new Date()
    return product
  }

  // Método para atualizar os dados do produto
  update(
    name: string,
    description: string,
    shortDescription: string,
    price: number,
    categoryId?: string,
    costPrice?: number,
    sku?: string,
    barcode?: string,
    stockQuantity?: number,
    minStockLevel?: number,
    maxStockLevel?: number,
    dimensions?: ProductDimensions,
    weight?: ProductWeight,
    images?: ProductImage[],
    isActive?: boolean,
    isFeatured?: boolean,
    isDigital?: boolean,
    slug?: string,
    metaTitle?: string,
    metaDescription?: string
  ): void {
    this.name = name
    this.description = description
    this.shortDescription = shortDescription
    this.price = price
    this.categoryId = categoryId
    this.costPrice = costPrice
    this.sku = sku
    this.barcode = barcode
    this.stockQuantity = stockQuantity !== undefined ? stockQuantity : this.stockQuantity
    this.minStockLevel = minStockLevel !== undefined ? minStockLevel : this.minStockLevel
    this.maxStockLevel = maxStockLevel
    this.dimensions = dimensions
    this.weight = weight
    this.images = images
    this.isActive = isActive !== undefined ? isActive : this.isActive
    this.isFeatured = isFeatured !== undefined ? isFeatured : this.isFeatured
    this.isDigital = isDigital !== undefined ? isDigital : this.isDigital
    this.slug = slug || this.slug
    this.metaTitle = metaTitle
    this.metaDescription = metaDescription
    this.updatedAt = new Date()
  }

  // Validações de negócio

  // Verificar se todos os dados obrigatórios estão preenchidos
  isValid(): boolean {
    return !!(this.name && 
             this.description && 
             this.shortDescription && 
             this.price > 0 &&
             this.companyId)
  }

  // Verificar se o produto tem estoque baixo
  hasLowStock(): boolean {
    return this.stockQuantity <= this.minStockLevel
  }

  // Verificar se o produto está fora de estoque
  isOutOfStock(): boolean {
    return this.stockQuantity <= 0
  }

  // Verificar se tem estoque disponível para venda
  hasStock(): boolean {
    return this.availableQuantity > 0
  }

  // Verificar se é um produto físico
  isPhysical(): boolean {
    return !this.isDigital
  }

  // Calcular margem de lucro
  getProfitMargin(): number {
    if (!this.costPrice || this.costPrice <= 0) {
      return 0
    }
    return ((this.price - this.costPrice) / this.price) * 100
  }

  // Calcular valor total do estoque
  getTotalStockValue(): number {
    return this.stockQuantity * this.price
  }

  // Reservar estoque
  reserveStock(quantity: number): boolean {
    if (this.availableQuantity >= quantity) {
      this.reservedQuantity += quantity
      this.availableQuantity -= quantity
      return true
    }
    return false
  }

  // Liberar reserva de estoque
  releaseStock(quantity: number): void {
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity)
    this.availableQuantity += quantity
  }

  // Atualizar estoque após venda
  updateStockAfterSale(quantity: number): void {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity)
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity)
  }

  // Adicionar imagem
  addImage(image: ProductImage): void {
    if (!this.images) {
      this.images = []
    }
    this.images.push(image)
  }

  // Obter imagem principal
  getPrimaryImage(): ProductImage | null {
    if (!this.images || this.images.length === 0) {
      return null
    }
    return this.images.find(img => img.isPrimary()) || this.images[0]
  }

  // Obter SKU formatado
  getFormattedSku(): string {
    return this.sku || this.id.substring(0, 8).toUpperCase()
  }

  // Gerar slug a partir do nome
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Verificar se o slug é válido
  hasValidSlug(): boolean {
    if (!this.slug) {
      return false
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugRegex.test(this.slug)
  }

  // Atualizar slug baseado no nome
  updateSlug(): void {
    this.slug = this.generateSlug(this.name)
  }

  // Método para soft delete
  delete(): void {
    this.isDeleted = true
    this.deletedAt = new Date()
  }

  // Método para restaurar produto deletado
  restore(): void {
    this.isDeleted = false
    this.deletedAt = undefined
  }

  // Verificar se o produto está ativo e válido
  isActiveAndValid(): boolean {
    return !this.isDeleted && this.isActive && this.isValid()
  }

  // Verificar se o produto pode ser editado
  canBeEdited(): boolean {
    return !this.isDeleted
  }

  // Verificar se o produto pode ser deletado
  canBeDeleted(): boolean {
    return !this.isOutOfStock() && !this.reservedQuantity > 0
  }
}

export default Product
