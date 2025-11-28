import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IProductsRepository, { ProductFilters } from '../../repositories/IProductsRepository'
import Product from '../../entities/Product'

export interface ListProductsFilters extends ProductFilters {}

@injectable()
export default class ListProductsUseCase implements IUseCase<ListProductsFilters, IPaginationResult<Product>> {
  constructor(
    @Inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  async execute(filters: ListProductsFilters): Promise<IResult<IPaginationResult<Product>>> {
    try {
      console.log('ListProductsUseCase.execute:', filters)
      
      const result = await this.productsRepository.findWithFilters(filters)

      return {
        success: true,
        data: result,
        message: 'Produtos listados com sucesso'
      }
    } catch (error) {
      console.error('Error in ListProductsUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar produtos'
      }
    }
  }
}