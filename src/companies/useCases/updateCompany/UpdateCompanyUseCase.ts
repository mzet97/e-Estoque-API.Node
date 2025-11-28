import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICompaniesRepository from '../../repositories/ICompaniesRepository'
import Company from '../../entities/Company'
import UpdateCompanyViewModel from '../../viewModels/UpdateCompanyViewModel'

@injectable()
export default class UpdateCompanyUseCase implements IUseCase<{ id: string, viewModel: UpdateCompanyViewModel }, Company> {
  constructor(
    @Inject('CompaniesRepository')
    private companiesRepository: ICompaniesRepository,
  ) {}

  async execute({ id, viewModel }: { id: string, viewModel: UpdateCompanyViewModel }): Promise<IResult<Company>> {
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

      const existingCompany = existingCompanyResult.data

      // Se está alterando documento, verificar se não existe outro com o mesmo documento
      if (viewModel.docId && viewModel.docId !== existingCompany.docId) {
        const existingDocResult = await this.companiesRepository.findByDocId(viewModel.docId)
        if (existingDocResult.success && existingDocResult.data.id !== id) {
          return {
            success: false,
            data: null,
            message: 'Já existe uma empresa cadastrada com este documento'
          }
        }
      }

      // Se está alterando email, verificar se não existe outro com o mesmo email
      if (viewModel.email && viewModel.email !== existingCompany.email) {
        const existingEmailResult = await this.companiesRepository.findByEmail(viewModel.email)
        if (existingEmailResult.success && existingEmailResult.data.id !== id) {
          return {
            success: false,
            data: null,
            message: 'Já existe uma empresa cadastrada com este email'
          }
        }
      }

      // Processar endereço se fornecido
      let companyAddress = undefined
      if (viewModel.companyAddress) {
        companyAddress = viewModel.companyAddress.toCustomerAddress()
      }

      // Aplicar as atualizações
      const updateData = {
        ...viewModel,
        companyAddress
      }

      // Remover campos undefined para não sobrescrever acidentalmente
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Atualizar no banco de dados
      const result = await this.companiesRepository.update(id, updateData)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao atualizar empresa no banco de dados'
        }
      }

      // Validar a empresa após atualização
      const updatedCompany = result.data
      if (!updatedCompany.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados atualizados da empresa são inválidos'
        }
      }

      // Validar endereço se fornecido
      if (companyAddress && !companyAddress.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Endereço da empresa é inválido'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Empresa atualizada com sucesso'
      }
    } catch (error) {
      console.error('Error in UpdateCompanyUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao atualizar empresa'
      }
    }
  }
}
