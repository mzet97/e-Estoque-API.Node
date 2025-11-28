import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICompaniesRepository from '../../repositories/ICompaniesRepository'

@injectable()
export default class DeleteCompanyUseCase implements IUseCase<string, void> {
  constructor(
    @Inject('CompaniesRepository')
    private companiesRepository: ICompaniesRepository,
  ) {}

  async execute(id: string): Promise<IResult<void>> {
    try {
      // Verificar se a empresa existe
      const existingCompanyResult = await this.companiesRepository.findById(id)
      if (!existingCompanyResult.success) {
        return {
          success: false,
          data: null,
          message: 'Empresa não encontrada'
        }
      }

      // Soft delete
      const result = await this.companiesRepository.delete(id)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao deletar empresa'
        }
      }

      return {
        success: true,
        data: null,
        message: 'Empresa deletada com sucesso'
      }
    } catch (error) {
      console.error('Error in DeleteCompanyUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao deletar empresa'
      }
    }
  }
}
