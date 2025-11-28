import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ICategoriesRepository from '../../repositories/ICategoriesRepository'
import Category from '../../entities/Category'

export interface ListCategoriesFilters {
  page?: number
  pageSize?: number
  searchTerm?: string
  isActive?: boolean
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

@injectable()
export default class ListCategoriesUseCase implements IUseCase<ListCategoriesFilters, IPaginationResult<Category>> {
  constructor(
    @Inject('CategoriesRepository')
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute(filters: ListCategoriesFilters): Promise<IResult<IPaginationResult<Category>>> {
    try {
      console.log('ListCategoriesUseCase.execute:', filters)
      
      const result = await this.categoriesRepository.findWithFilters(filters)

      return {
        success: true,
        data: result,
        message: 'Categorias listadas com sucesso'
      }
    } catch (error) {
      console.error('Error in ListCategoriesUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar categorias'
      }
    }
  }
}