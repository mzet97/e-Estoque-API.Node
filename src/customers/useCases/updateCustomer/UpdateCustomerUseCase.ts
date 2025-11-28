import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICustomersRepository from '../../repositories/ICustomersRepository'
import Customer from '../../entities/Customer'
import UpdateCustomerViewModel from '../../viewModels/UpdateCustomerViewModel'
import { DocumentValidationService } from '@shared/services/DocumentValidationService'

@injectable()
export default class UpdateCustomerUseCase implements IUseCase<UpdateCustomerViewModel, Customer> {
  constructor(
    @Inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(viewModel: UpdateCustomerViewModel): Promise<IResult<Customer>> {
    try {
      // Validar se o customerId foi fornecido
      if (!viewModel.customerId) {
        return {
          success: false,
          data: null,
          message: 'Customer ID é obrigatório para atualização'
        }
      }

      // Buscar o cliente existente
      const existingCustomerResult = await this.customersRepository.findById(viewModel.customerId)
      if (!existingCustomerResult.success) {
        return {
          success: false,
          data: null,
          message: 'Cliente não encontrado'
        }
      }

      const existingCustomer = existingCustomerResult.data

      // Validar documento se foi fornecido
      if (viewModel.docId && viewModel.docId !== existingCustomer.docId) {
        // Verificar se já existe outro cliente com o novo documento
        const existingDocResult = await this.customersRepository.findByDocId(viewModel.docId)
        if (existingDocResult.success && existingDocResult.data.id !== viewModel.customerId) {
          return {
            success: false,
            data: null,
            message: 'Já existe outro cliente cadastrado com este documento'
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
      }

      // Validar email se foi fornecido
      if (viewModel.email && viewModel.email !== existingCustomer.email) {
        // Verificar se já existe outro cliente com o novo email
        const existingEmailResult = await this.customersRepository.findByEmail(viewModel.email)
        if (existingEmailResult.success && existingEmailResult.data.id !== viewModel.customerId) {
          return {
            success: false,
            data: null,
            message: 'Já existe outro cliente cadastrado com este email'
          }
        }
      }

      // Criar instância do endereço se fornecido
      let customerAddress = undefined
      if (viewModel.customerAddress) {
        customerAddress = viewModel.customerAddress.toCustomerAddress()
        
        // Validar endereço se fornecido
        if (!customerAddress.isValid()) {
          return {
            success: false,
            data: null,
            message: 'Endereço do cliente é inválido'
          }
        }
      }

      // Atualizar os dados do cliente
      existingCustomer.update(
        viewModel.name || existingCustomer.name,
        viewModel.docId || existingCustomer.docId,
        viewModel.email || existingCustomer.email,
        viewModel.description !== undefined ? viewModel.description : existingCustomer.description,
        viewModel.shortDescription !== undefined ? viewModel.shortDescription : existingCustomer.shortDescription,
        viewModel.phoneNumber !== undefined ? viewModel.phoneNumber : existingCustomer.phoneNumber,
        customerAddress !== undefined ? customerAddress : existingCustomer.customerAddress
      )

      // Validar telefone se fornecido
      if (viewModel.phoneNumber && !existingCustomer.isValidPhoneNumber()) {
        return {
          success: false,
          data: null,
          message: 'Número de telefone é inválido'
        }
      }

      // Validar cliente atualizado
      if (!existingCustomer.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados atualizados do cliente são inválidos'
        }
      }

      // Salvar no banco de dados
      const result = await this.customersRepository.update(viewModel.customerId, existingCustomer)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao atualizar cliente no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Cliente atualizado com sucesso'
      }
    } catch (error) {
      console.error('Error in UpdateCustomerUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao atualizar cliente'
      }
    }
  }
}