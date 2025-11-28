import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICompaniesRepository from '../../repositories/ICompaniesRepository'

@injectable()
export default class GetCompanyUseCase implements IUseCase<string, any> {
  constructor(
    @Inject('CompaniesRepository')
    private companiesRepository: ICompaniesRepository,
  ) {}

  async execute(id: string): Promise<IResult<any>> {
    try {
      const result = await this.companiesRepository.findById(id)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Empresa não encontrada'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Empresa encontrada com sucesso'
      }
    } catch (error) {
      console.error('Error in GetCompanyUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao buscar empresa'
      }
    }
  }
}
