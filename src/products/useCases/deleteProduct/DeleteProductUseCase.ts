import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IProductsRepository from '../../repositories/IProductsRepository'

@injectable()
export default class DeleteProductUseCase implements IUseCase<string, void> {
  constructor(
    @Inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string): Promise<IResult<void>> {
    try {
      console.log('DeleteProductUseCase.execute:', { id })
      
      // Verificar se o produto existe
      const existingProductResult = await this.productsRepository.findById(id)
      if (!existingProductResult.success) {
        return {
          success: false,
          data: null,
          message: 'Produto não encontrado'
        }
      }

      // Executar soft delete
      const result = await this.productsRepository.delete(id)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao excluir produto do banco de dados'
        }
      }

      return {
        success: true,
        data: undefined,
        message: 'Produto excluído com sucesso'
      }
    } catch (error) {
      console.error('Error in DeleteProductUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao excluir produto'
      }
    }
  }
}