import { IsNumber, Min, IsOptional } from 'class-validator'

export class ProductWeight {
  @IsNumber({ message: 'Weight deve ser um número' })
  @Min(0.001, { message: 'Weight deve ser maior que 0.001' })
  weight: number

  @IsOptional()
  @IsNumber({ message: 'GrossWeight deve ser um número' })
  @Min(0.001, { message: 'GrossWeight deve ser maior que 0.001' })
  grossWeight?: number

  constructor(weight: number, grossWeight?: number) {
    this.weight = weight
    this.grossWeight = grossWeight
  }

  // Peso líquido é o peso básico
  getNetWeight(): number {
    return this.weight
  }

  // Peso bruto (incluindo embalagem)
  getGrossWeight(): number {
    return this.grossWeight || this.weight
  }

  // Calcular diferença entre peso bruto e líquido
  getPackagingWeight(): number {
    if (!this.grossWeight) {
      return 0
    }
    return this.grossWeight - this.weight
  }

  // Verificar se o peso é válido
  isValid(): boolean {
    return this.weight > 0 && (!this.grossWeight || this.grossWeight >= this.weight)
  }

  // Converter para string formatada
  toString(): string {
    const netWeight = `${this.weight}kg`
    if (this.grossWeight) {
      return `${netWeight} (bruto: ${this.grossWeight}kg)`
    }
    return netWeight
  }

  // Verificar se o produto é pesado (> 30kg)
  isHeavy(): boolean {
    return this.getGrossWeight() > 30
  }

  // Verificar se o produto é super pesado (> 100kg)
  isVeryHeavy(): boolean {
    return this.getGrossWeight() > 100
  }

  // Método estático para criar peso válido
  static createValid(weight: number, grossWeight?: number): ProductWeight | null {
    try {
      const productWeight = new ProductWeight(weight, grossWeight)
      if (productWeight.isValid()) {
        return productWeight
      }
      return null
    } catch (error) {
      return null
    }
  }
}

export default ProductWeight
