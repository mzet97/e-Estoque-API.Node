import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICategoriesRepository from '../../repositories/ICategoriesRepository'
import Category from '../../entities/Category'

@injectable()
export default class GetCategoryUseCase implements IUseCase<string, Category> {
  constructor(
    @Inject('CategoriesRepository')
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute(id: string): Promise<IResult<Category>> {
    try {
      console.log('GetCategoryUseCase.execute:', { id })
      
      const result = await this.categoriesRepository.findById(id)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Categoria não encontrada'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Categoria encontrada com sucesso'
      }
    } catch (error) {
      console.error('Error in GetCategoryUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao buscar categoria'
      }
    }
  }
}