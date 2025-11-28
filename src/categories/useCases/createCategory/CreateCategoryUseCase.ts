import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICategoriesRepository from '../../repositories/ICategoriesRepository'
import Category from '../../entities/Category'

export interface CreateCategoryViewModel {
  name: string
  description?: string
  shortDescription?: string
  parentCategoryId?: string
  sortOrder?: number
  isActive?: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
}

@injectable()
export default class CreateCategoryUseCase implements IUseCase<CreateCategoryViewModel, Category> {
  constructor(
    @Inject('CategoriesRepository')
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute(viewModel: CreateCategoryViewModel): Promise<IResult<Category>> {
    try {
      // Verificar se já existe uma categoria com o mesmo nome
      const existingNameResult = await this.categoriesRepository.findByName(viewModel.name)
      if (existingNameResult.success) {
        return {
          success: false,
          data: null,
          message: 'Já existe uma categoria com este nome'
        }
      }

      // Verificar se já existe uma categoria com o mesmo slug
      if (viewModel.slug) {
        const existingSlugResult = await this.categoriesRepository.findBySlug(viewModel.slug)
        if (existingSlugResult.success) {
          return {
            success: false,
            data: null,
            message: 'Já existe uma categoria com este slug'
          }
        }
      }

      // Verificar se a categoria pai existe (se fornecida)
      if (viewModel.parentCategoryId) {
        const parentResult = await this.categoriesRepository.findById(viewModel.parentCategoryId)
        if (!parentResult.success) {
          return {
            success: false,
            data: null,
            message: 'Categoria pai não encontrada'
          }
        }
      }

      // Criar a instância da categoria
      const category = Category.create(
        viewModel.name,
        viewModel.description,
        viewModel.shortDescription,
        viewModel.parentCategoryId,
        viewModel.sortOrder || 0,
        viewModel.isActive !== false,
        viewModel.slug,
        viewModel.metaTitle,
        viewModel.metaDescription
      )

      // Validar a categoria
      if (!category.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados da categoria são inválidos'
        }
      }

      // Verificar se o slug é válido
      if (category.slug && !category.hasValidSlug()) {
        return {
          success: false,
          data: null,
          message: 'Slug inválido'
        }
      }

      // Salvar no banco de dados
      const result = await this.categoriesRepository.create(category)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao salvar categoria no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Categoria criada com sucesso'
      }
    } catch (error) {
      console.error('Error in CreateCategoryUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao criar categoria'
      }
    }
  }
}
