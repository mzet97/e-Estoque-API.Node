import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICompaniesRepository from '../../repositories/ICompaniesRepository'
import Company from '../../entities/Company'
import CreateCompanyViewModel from '../../viewModels/CreateCompanyViewModel'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

@injectable()
export default class CreateCompanyUseCase implements IUseCase<CreateCompanyViewModel, Company> {
  constructor(
    @Inject('CompaniesRepository')
    private companiesRepository: ICompaniesRepository,
  ) {}

  async execute(viewModel: CreateCompanyViewModel): Promise<IResult<Company>> {
    try {
      // Verificar se já existe uma empresa com o mesmo documento
      const existingDocResult = await this.companiesRepository.findByDocId(viewModel.docId)
      if (existingDocResult.success) {
        return {
          success: false,
          data: null,
          message: 'Já existe uma empresa cadastrada com este documento'
        }
      }

      // Verificar se já existe uma empresa com o mesmo email
      const existingEmailResult = await this.companiesRepository.findByEmail(viewModel.email)
      if (existingEmailResult.success) {
        return {
          success: false,
          data: null,
          message: 'Já existe uma empresa cadastrada com este email'
        }
      }

      // Criar a instância da empresa
      let companyAddress = undefined
      if (viewModel.companyAddress) {
        companyAddress = viewModel.companyAddress.toCustomerAddress()
      }

      const company = Company.create(
        viewModel.name,
        viewModel.docId,
        viewModel.email,
        viewModel.description,
        viewModel.phoneNumber,
        companyAddress
      )

      // Validar a empresa
      if (!company.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados da empresa são inválidos'
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

      // Salvar no banco de dados
      const result = await this.companiesRepository.create(company)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao salvar empresa no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Empresa criada com sucesso'
      }
    } catch (error) {
      console.error('Error in CreateCompanyUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao criar empresa'
      }
    }
  }
}
