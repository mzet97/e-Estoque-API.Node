import IResult from '@shared/viewModels/IResult'
import IUseCase from '@shared/useCases/IUseCase'
import CompanyAddressesRepository from '../../repositories/CompanyAddressesRepository'

export default class DeleteCompanyAddressUseCase implements IUseCase {
  private companyAddressesRepository: CompanyAddressesRepository

  constructor() {
    this.companyAddressesRepository = new CompanyAddressesRepository()
  }

  async execute(id: string): Promise<IResult<void>> {
    try {
      console.log('DeleteCompanyAddressUseCase.execute:', { id })

      // Verificar se endereço existe
      const existingAddress = await this.companyAddressesRepository.findById(id)
      if (!existingAddress.success) {
        return {
          success: false,
          message: 'Endereço da empresa não encontrado',
          data: null
        }
      }

      // Verificar se pode ser deletado
      if (existingAddress.data.isHeadquarters) {
        return {
          success: false,
          message: 'Não é possível deletar a sede da empresa. Defina outro endereço como sede primeiro.',
          data: null
        }
      }

      // Soft delete
      const result = await this.companyAddressesRepository.delete(id)

      if (result.success) {
        console.log('DeleteCompanyAddressUseCase.execute:', { id, message: result.message })
      }

      return result
    } catch (error) {
      console.error('DeleteCompanyAddressUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao deletar endereço da empresa',
        data: null
      }
    }
  }
}