import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IProductsRepository from '../../repositories/IProductsRepository'
import Product from '../../entities/Product'
import ProductDimensions from '../../valueObjects/ProductDimensions'
import ProductWeight from '../../valueObjects/ProductWeight'
import ProductImage from '../../valueObjects/ProductImage'
import { CreateProductViewModel } from '../createProduct/CreateProductUseCase'

export interface UpdateProductViewModel extends Partial<CreateProductViewModel> {}

@injectable()
export default class UpdateProductUseCase implements IUseCase<{ id: string; data: UpdateProductViewModel }, Product> {
  constructor(
    @Inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string, data: UpdateProductViewModel): Promise<IResult<Product>> {
    try {
      // Verificar se o produto existe
      const existingProductResult = await this.productsRepository.findById(id)
      if (!existingProductResult.success) {
        return {
          success: false,
          data: null,
          message: 'Produto não encontrado'
        }
      }

      const existingProduct = existingProductResult.data!

      // Verificar se já existe outro produto com o mesmo SKU
      if (data.sku && data.sku !== existingProduct.sku) {
        const existingSkuResult = await this.productsRepository.findBySku(data.sku)
        if (existingSkuResult.success) {
          return {
            success: false,
            data: null,
            message: 'Já existe um produto com este SKU'
          }
        }
      }

      // Verificar se já existe outro produto com o mesmo barcode
      if (data.barcode && data.barcode !== existingProduct.barcode) {
        const existingBarcodeResult = await this.productsRepository.findByBarcode(data.barcode)
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
      if (data.width || data.height || data.length) {
        dimensions = ProductDimensions.createValid(
          data.width || existingProduct.dimensions?.width || 0,
          data.height || existingProduct.dimensions?.height || 0,
          data.length || existingProduct.dimensions?.length || 0,
          data.depth || existingProduct.dimensions?.depth
        )
      }

      // Criar peso se fornecido
      let weight = undefined
      if (data.weight || data.grossWeight) {
        weight = ProductWeight.createValid(
          data.weight || existingProduct.weight?.weight || 0,
          data.grossWeight || existingProduct.weight?.grossWeight
        )
      }

      // Criar imagem se fornecida
      let images = undefined
      if (data.imageUrl && data.imageAltText) {
        images = [ProductImage.createPrimary(data.imageUrl, data.imageAltText)]
      }

      // Atualizar dados do produto
      const updateData: Partial<Product> = {
        name: data.name || existingProduct.name,
        description: data.description || existingProduct.description,
        shortDescription: data.shortDescription || existingProduct.shortDescription,
        price: data.price !== undefined ? data.price : existingProduct.price,
        costPrice: data.costPrice !== undefined ? data.costPrice : existingProduct.costPrice,
        sku: data.sku !== undefined ? data.sku : existingProduct.sku,
        barcode: data.barcode !== undefined ? data.barcode : existingProduct.barcode,
        stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : existingProduct.stockQuantity,
        minStockLevel: data.minStockLevel !== undefined ? data.minStockLevel : existingProduct.minStockLevel,
        maxStockLevel: data.maxStockLevel !== undefined ? data.maxStockLevel : existingProduct.maxStockLevel,
        dimensions: dimensions || existingProduct.dimensions,
        weight: weight || existingProduct.weight,
        images: images || existingProduct.images,
        isActive: data.isActive !== undefined ? data.isActive : existingProduct.isActive,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : existingProduct.isFeatured,
        isDigital: data.isDigital !== undefined ? data.isDigital : existingProduct.isDigital,
        slug: data.slug || existingProduct.slug,
        metaTitle: data.metaTitle || existingProduct.metaTitle,
        metaDescription: data.metaDescription || existingProduct.metaDescription
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

      // Atualizar no banco de dados
      const result = await this.productsRepository.update(id, updateData)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao atualizar produto no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Produto atualizado com sucesso'
      }
    } catch (error) {
      console.error('Error in UpdateProductUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao atualizar produto'
      }
    }
  }
}