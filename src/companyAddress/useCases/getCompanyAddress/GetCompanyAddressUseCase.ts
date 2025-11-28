import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CompanyAddressesRepository from '../../repositories/CompanyAddressesRepository'

export default class GetCompanyAddressUseCase implements IUseCase {
  private companyAddressesRepository: CompanyAddressesRepository

  constructor() {
    this.companyAddressesRepository = new CompanyAddressesRepository()
  }

  async execute(id: string): Promise<IResult<any>> {
    try {
      console.log('GetCompanyAddressUseCase.execute:', { id })

      const result = await this.companyAddressesRepository.findById(id)

      if (!result.success) {
        console.error('GetCompanyAddressUseCase.execute:', { message: result.message })
        return result
      }

      console.log('GetCompanyAddressUseCase.execute:', { 
        id: result.data.id, 
        type: result.data.type,
        message: result.message 
      })

      return result
    } catch (error) {
      console.error('GetCompanyAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao buscar endereço da empresa',
        data: null
      }
    }
  }
}