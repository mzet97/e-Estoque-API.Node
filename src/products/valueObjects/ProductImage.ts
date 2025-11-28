import { IsString, IsOptional, IsUrl, Length } from 'class-validator'

export enum ImageType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  THUMBNAIL = 'thumbnail',
  DETAIL = 'detail',
  LIFESTYLE = 'lifestyle'
}

export class ProductImage {
  @IsString({ message: 'Url deve ser uma string' })
  @IsUrl({}, { message: 'Url deve ser uma URL válida' })
  url: string

  @IsString({ message: 'AltText deve ser uma string' })
  @Length(1, 255, { message: 'AltText deve ter entre 1 e 255 caracteres' })
  altText: string

  @IsOptional()
  @IsString({ message: 'Title deve ser uma string' })
  @Length(0, 255, { message: 'Title deve ter no máximo 255 caracteres' })
  title?: string

  @IsOptional()
  @IsString({ message: 'Caption deve ser uma string' })
  @Length(0, 500, { message: 'Caption deve ter no máximo 500 caracteres' })
  caption?: string

  @IsOptional()
  @IsString({ message: 'Type deve ser uma string' })
  type: ImageType

  @IsOptional()
  @IsNumber({ message: 'SortOrder deve ser um número' })
  sortOrder?: number

  constructor(
    url: string,
    altText: string,
    title?: string,
    caption?: string,
    type: ImageType = ImageType.PRIMARY,
    sortOrder: number = 0
  ) {
    this.url = url
    this.altText = altText
    this.title = title
    this.caption = caption
    this.type = type
    this.sortOrder = sortOrder
  }

  // Verificar se a imagem é válida
  isValid(): boolean {
    return !!(this.url && this.altText && this.altText.trim().length > 0)
  }

  // Verificar se é a imagem principal
  isPrimary(): boolean {
    return this.type === ImageType.PRIMARY
  }

  // Verificar se é imagem secundária
  isSecondary(): boolean {
    return this.type === ImageType.SECONDARY
  }

  // Verificar se é thumbnail
  isThumbnail(): boolean {
    return this.type === ImageType.THUMBNAIL
  }

  // Obter a URL da imagem com tamanho específico (se aplicável)
  getResizedUrl(width?: number, height?: number): string {
    if (!width && !height) {
      return this.url
    }
    
    // Lógica para redimensionar URL (depende do provedor de storage)
    // Exemplo genérico - em produção seria específico do provedor
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    
    const separator = this.url.includes('?') ? '&' : '?'
    return `${this.url}${separator}${params.toString()}`
  }

  // Método estático para criar imagem principal
  static createPrimary(url: string, altText: string): ProductImage {
    return new ProductImage(url, altText, undefined, undefined, ImageType.PRIMARY, 0)
  }

  // Método estático para criar imagem secundária
  static createSecondary(url: string, altText: string, sortOrder: number = 1): ProductImage {
    return new ProductImage(url, altText, undefined, undefined, ImageType.SECONDARY, sortOrder)
  }

  // Método estático para criar thumbnail
  static createThumbnail(url: string, altText: string): ProductImage {
    return new ProductImage(url, altText, undefined, undefined, ImageType.THUMBNAIL, 0)
  }
}

export default ProductImage
