import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IProductsRepository from '../../repositories/IProductsRepository'
import Product from '../../entities/Product'

@injectable()
export default class GetProductUseCase implements IUseCase<string, Product> {
  constructor(
    @Inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string): Promise<IResult<Product>> {
    try {
      console.log('GetProductUseCase.execute:', { id })
      
      const result = await this.productsRepository.findById(id)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Produto não encontrado'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Produto encontrado com sucesso'
      }
    } catch (error) {
      console.error('Error in GetProductUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao buscar produto'
      }
    }
  }
}