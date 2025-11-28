import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IProductsRepository from '../../repositories/IProductsRepository'
import Product from '../../entities/Product'
import ProductDimensions from '../../valueObjects/ProductDimensions'
import ProductWeight from '../../valueObjects/ProductWeight'
import ProductImage from '../../valueObjects/ProductImage'

export interface CreateProductViewModel {
  name: string
  description: string
  shortDescription: string
  price: number
  companyId: string
  categoryId?: string
  costPrice?: number
  sku?: string
  barcode?: string
  stockQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  width?: number
  height?: number
  length?: number
  depth?: number
  weight?: number
  grossWeight?: number
  imageUrl?: string
  imageAltText?: string
  isActive?: boolean
  isFeatured?: boolean
  isDigital?: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
}

@injectable()
export default class CreateProductUseCase implements IUseCase<CreateProductViewModel, Product> {
  constructor(
    @Inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  async execute(viewModel: CreateProductViewModel): Promise<IResult<Product>> {
    try {
      // Verificar se já existe um produto com o mesmo SKU
      if (viewModel.sku) {
        const existingSkuResult = await this.productsRepository.findBySku(viewModel.sku)
        if (existingSkuResult.success) {
          return {
            success: false,
            data: null,
            message: 'Já existe um produto com este SKU'
          }
        }
      }

      // Verificar se já existe um produto com o mesmo barcode
      if (viewModel.barcode) {
        const existingBarcodeResult = await this.productsRepository.findByBarcode(viewModel.barcode)
        if (existingBarcodeResult.success) {
          return {
            success: false,
            data: null,
            message: 'Já existe um produto com este barcode'
          }
        }
      }

      // Criar dimensões se fornecidas
      let dimensions = undefined
      if (viewModel.width && viewModel.height && viewModel.length) {
        dimensions = ProductDimensions.createValid(
          viewModel.width,
          viewModel.height,
          viewModel.length,
          viewModel.depth
        )
      }

      // Criar peso se fornecido
      let weight = undefined
      if (viewModel.weight) {
        weight = ProductWeight.createValid(viewModel.weight, viewModel.grossWeight)
      }

      // Criar imagem se fornecida
      let images = undefined
      if (viewModel.imageUrl && viewModel.imageAltText) {
        images = [ProductImage.createPrimary(viewModel.imageUrl, viewModel.imageAltText)]
      }

      // Criar a instância do produto
      const product = Product.create(
        viewModel.name,
        viewModel.description,
        viewModel.shortDescription,
        viewModel.price,
        viewModel.companyId,
        viewModel.categoryId,
        viewModel.costPrice,
        viewModel.sku,
        viewModel.barcode,
        viewModel.stockQuantity || 0,
        viewModel.minStockLevel || 0,
        viewModel.maxStockLevel,
        dimensions,
        weight,
        images,
        viewModel.isActive !== false,
        viewModel.isFeatured || false,
        viewModel.isDigital || false,
        viewModel.slug,
        viewModel.metaTitle,
        viewModel.metaDescription
      )

      // Validar o produto
      if (!product.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados do produto são inválidos'
        }
      }

      // Validar dimensões se fornecidas
      if (dimensions && !dimensions.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dimensões do produto são inválidas'
        }
      }

      // Validar peso se fornecido
      if (weight && !weight.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Peso do produto é inválido'
        }
      }

      // Salvar no banco de dados
      const result = await this.productsRepository.create(product)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao salvar produto no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Produto criado com sucesso'
      }
    } catch (error) {
      console.error('Error in CreateProductUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao criar produto'
      }
    }
  }
}
