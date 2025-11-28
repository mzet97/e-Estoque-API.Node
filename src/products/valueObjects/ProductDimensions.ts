import { IsNumber, Min, IsOptional, IsPositive } from 'class-validator'

export class ProductDimensions {
  @IsNumber({ message: 'Width deve ser um número' })
  @IsPositive({ message: 'Width deve ser maior que zero' })
  @Min(0.01, { message: 'Width deve ser maior que 0.01' })
  width: number

  @IsNumber({ message: 'Height deve ser um número' })
  @IsPositive({ message: 'Height deve ser maior que zero' })
  @Min(0.01, { message: 'Height deve ser maior que 0.01' })
  height: number

  @IsNumber({ message: 'Length deve ser um número' })
  @IsPositive({ message: 'Length deve ser maior que zero' })
  @Min(0.01, { message: 'Length deve ser maior que 0.01' })
  length: number

  @IsOptional()
  @IsNumber({ message: 'Depth deve ser um número' })
  @Min(0, { message: 'Depth deve ser maior ou igual a zero' })
  depth?: number

  constructor(
    width: number,
    height: number,
    length: number,
    depth?: number
  ) {
    this.width = width
    this.height = height
    this.length = length
    this.depth = depth
  }

  // Calcular volume em cm³
  getVolume(): number {
    if (this.depth) {
      return this.width * this.height * this.length * this.depth
    }
    return this.width * this.height * this.length
  }

  // Calcular área da base em cm²
  getBaseArea(): number {
    return this.width * this.length
  }

  // Verificar se as dimensões são válidas
  isValid(): boolean {
    return this.width > 0 && this.height > 0 && this.length > 0
  }

  // Converter para string formatada
  toString(): string {
    const base = `${this.width}x${this.height}x${this.length}cm`
    return this.depth ? `${base}x${this.depth}cm` : base
  }

  // Verificar se cabe em outro espaço
  canFitIn(otherDimensions: ProductDimensions): boolean {
    return this.width <= otherDimensions.width &&
           this.height <= otherDimensions.height &&
           this.length <= otherDimensions.length
  }

  // Método estático para criar dimensões válidas
  static createValid(
    width: number,
    height: number,
    length: number,
    depth?: number
  ): ProductDimensions | null {
    try {
      const dimensions = new ProductDimensions(width, height, length, depth)
      if (dimensions.isValid()) {
        return dimensions
      }
      return null
    } catch (error) {
      return null
    }
  }
}

export default ProductDimensions
