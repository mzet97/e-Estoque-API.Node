import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm'

@Entity('categories')
export class Category extends BaseEntity {

  @Column({
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
    name: 'short_description',
    length: 500,
    nullable: true,
  })
  shortDescription?: string

  // Hierarchical relationship
  @Column({
    name: 'parent_category_id',
    type: 'uuid',
    nullable: true,
  })
  parentCategoryId?: string

  @ManyToOne(() => Category, (category) => category.subCategories, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory?: Category

  @OneToMany(() => Category, (category) => category.parentCategory)
  subCategories: Category[]

  @Column({
    name: 'sort_order',
    type: 'integer',
    default: 0,
  })
  sortOrder: number

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean

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

  constructor() {
    super()
  }

  // Factory method para criar uma nova Category
  static create(
    name: string,
    description?: string,
    shortDescription?: string,
    parentCategoryId?: string,
    sortOrder: number = 0,
    isActive: boolean = true,
    slug?: string,
    metaTitle?: string,
    metaDescription?: string
  ): Category {
    const category = new Category()
    category.name = name
    category.description = description
    category.shortDescription = shortDescription
    category.parentCategoryId = parentCategoryId
    category.sortOrder = sortOrder
    category.isActive = isActive
    category.slug = slug || this.generateSlug(name)
    category.metaTitle = metaTitle
    category.metaDescription = metaDescription
    category.createdAt = new Date()
    return category
  }

  // Método para atualizar os dados da categoria
  update(
    name: string,
    description?: string,
    shortDescription?: string,
    parentCategoryId?: string,
    sortOrder?: number,
    isActive?: boolean,
    slug?: string,
    metaTitle?: string,
    metaDescription?: string
  ): void {
    this.name = name
    this.description = description
    this.shortDescription = shortDescription
    this.parentCategoryId = parentCategoryId
    this.sortOrder = sortOrder !== undefined ? sortOrder : this.sortOrder
    this.isActive = isActive !== undefined ? isActive : this.isActive
    this.slug = slug || this.slug
    this.metaTitle = metaTitle
    this.metaDescription = metaDescription
    this.updatedAt = new Date()
  }

  // Validações de negócio

  // Verificar se é uma categoria raiz (não tem parent)
  isRoot(): boolean {
    return !this.parentCategoryId
  }

  // Verificar se é uma categoria folha (não tem subcategorias)
  isLeaf(): boolean {
    return !this.subCategories || this.subCategories.length === 0
  }

  // Verificar se pode ser deletada (não pode ter subcategorias ou produtos)
  canBeDeleted(): boolean {
    return this.isLeaf() // Simplificado - em produção, verificar produtos também
  }

  // Verificar se todos os dados obrigatórios estão preenchidos
  isValid(): boolean {
    return !!(this.name && this.name.trim().length >= 2)
  }

  // Gerar slug a partir do nome
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/[\s_-]+/g, '-') // Substitui espaços e underscores por hífen
      .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
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

  // Método para restaurar categoria deletada
  restore(): void {
    this.isDeleted = false
    this.deletedAt = undefined
  }

  // Verificar se a categoria está ativa (não foi deletada e isActive = true)
  isActiveAndValid(): boolean {
    return !this.isDeleted && this.isActive
  }

  // Obter o caminho completo da hierarquia (ex: Eletrônicos > Smartphones > Android)
  getFullPath(): string {
    if (this.parentCategory) {
      return `${this.parentCategory.getFullPath()} > ${this.name}`
    }
    return this.name
  }

  // Obter a profundidade na hierarquia (0 = raiz, 1 = subcategoria, etc.)
  getDepth(): number {
    if (!this.parentCategory) {
      return 0
    }
    return this.parentCategory.getDepth() + 1
  }

  // Verificar se é ancestor de outra categoria
  isAncestorOf(otherCategory: Category): boolean {
    if (!otherCategory.parentCategoryId) {
      return false
    }
    
    if (otherCategory.parentCategoryId === this.id) {
      return true
    }
    
    // Verificar recursivamente se é ancestor
    return this.subCategories.some(sub => sub.isAncestorOf(otherCategory))
  }

  // Verificar se é descendant de outra categoria
  isDescendantOf(otherCategory: Category): boolean {
    return otherCategory.isAncestorOf(this)
  }

  // Verificar se duas categorias estão na mesma linha hierárquica
  isInSameHierarchy(otherCategory: Category): boolean {
    return this.isAncestorOf(otherCategory) || this.isDescendantOf(otherCategory)
  }
}

export default Category
