import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ICustomersRepository from '../../repositories/ICustomersRepository'
import { IsString, IsOptional, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

export class DeleteCustomerViewModel {
  @IsString({ message: 'Customer ID deve ser uma string' })
  customerId: string

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return false
  })
  @IsBoolean({ message: 'HardDelete deve ser um boolean' })
  hardDelete?: boolean

  constructor(customerId: string, hardDelete: boolean = false) {
    this.customerId = customerId
    this.hardDelete = hardDelete
  }
}

@injectable()
export default class DeleteCustomerUseCase implements IUseCase<DeleteCustomerViewModel, void> {
  constructor(
    @Inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(viewModel: DeleteCustomerViewModel): Promise<IResult<void>> {
    try {
      // Verificar se o cliente existe
      const existingCustomerResult = await this.customersRepository.findById(viewModel.customerId)
      if (!existingCustomerResult.success) {
        return {
          success: false,
          data: null,
          message: 'Cliente não encontrado'
        }
      }

      // Nota: Por enquanto, implementamos apenas soft delete
      // Hard delete pode ser implementado posteriormente se necessário
      const result = await this.customersRepository.delete(viewModel.customerId)

      return result
    } catch (error) {
      console.error('Error in DeleteCustomerUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao deletar cliente'
      }
    }
  }
}