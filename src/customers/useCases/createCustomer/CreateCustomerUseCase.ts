import { inject, injectable } from 'tsyringe'
import IResult from '@shared/viewModels/IResult'
import ICustomersRepository from '../../repositories/ICustomersRepository'
import Customer from '../../entities/Customer'
import CreateCustomerViewModel from '../../viewModels/CreateCustomerViewModel'
import { DocumentValidationService } from '@shared/services/DocumentValidationService'

@injectable()
export default class CreateCustomerUseCase implements IUseCase<CreateCustomerViewModel, Customer> {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(viewModel: CreateCustomerViewModel): Promise<IResult<Customer>> {
    try {
      // Verificar se já existe um cliente com o mesmo documento
      const existingDocResult = await this.customersRepository.findByDocId(viewModel.docId)
      if (existingDocResult.success) {
        return {
          success: false,
          data: null,
          message: 'Já existe um cliente cadastrado com este documento'
        }
      }

      // Verificar se já existe um cliente com o mesmo email
      const existingEmailResult = await this.customersRepository.findByEmail(viewModel.email)
      if (existingEmailResult.success) {
        return {
          success: false,
          data: null,
          message: 'Já existe um cliente cadastrado com este email'
        }
      }

      // Validar o documento usando o serviço de validação
      if (!DocumentValidationService.validateDocument(viewModel.docId)) {
        return {
          success: false,
          data: null,
          message: 'Documento informado não é um CPF ou CNPJ válido'
        }
      }

      // Criar a instância do cliente
      let customerAddress = undefined
      if (viewModel.customerAddress) {
        customerAddress = viewModel.customerAddress.toCustomerAddress()
      }

      const customer = Customer.create(
        viewModel.name,
        viewModel.docId,
        viewModel.email,
        viewModel.description,
        viewModel.shortDescription,
        viewModel.phoneNumber,
        customerAddress
      )

      // Validar o cliente
      if (!customer.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados do cliente são inválidos'
        }
      }

      // Validar telefone se fornecido
      if (viewModel.phoneNumber && !customer.isValidPhoneNumber()) {
        return {
          success: false,
          data: null,
          message: 'Número de telefone é inválido'
        }
      }

      // Validar endereço se fornecido
      if (customerAddress && !customerAddress.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Endereço do cliente é inválido'
        }
      }

      // Salvar no banco de dados
      const result = await this.customersRepository.create(customer)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao salvar cliente no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Cliente criado com sucesso'
      }
    } catch (error) {
      console.error('Error in CreateCustomerUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao criar cliente'
      }
    }
  }
}