import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICustomersRepository from '../../repositories/ICustomersRepository'
import Customer from '../../entities/Customer'
import ShowCustomerViewModel from '../../viewModels/ShowCustomerViewModel'

@injectable()
export default class GetCustomerUseCase implements IUseCase<ShowCustomerViewModel, Customer> {
  constructor(
    @Inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(viewModel: ShowCustomerViewModel): Promise<IResult<Customer>> {
    try {
      // Buscar o cliente
      const result = await this.customersRepository.findById(viewModel.customerId)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Cliente não encontrado'
        }
      }

      // Verificar se o cliente está ativo (se não foi deletado)
      if (!result.data.isActive()) {
        return {
          success: false,
          data: null,
          message: 'Cliente não está ativo'
        }
      }

      return {
        success: true,
        data: result.data,
        message: 'Cliente encontrado com sucesso'
      }
    } catch (error) {
      console.error('Error in GetCustomerUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao buscar cliente'
      }
    }
  }
}