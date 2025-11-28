import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ISalesRepository from '../../repositories/ISalesRepository'
import Sale, { SaleType, PaymentType } from '../../entities/Sale'

@injectable()
export default class CreateSaleUseCase implements IUseCase<any, Sale> {
  constructor(
    @Inject('SalesRepository')
    private salesRepository: ISalesRepository,
  ) {}

  async execute(viewModel: any): Promise<IResult<Sale>> {
    try {
      const sale = Sale.create(
        viewModel.customerId,
        viewModel.companyId,
        viewModel.saleType,
        viewModel.paymentType,
        viewModel.totalAmount,
        viewModel.saleDate,
        viewModel.paymentDueDate,
        viewModel.deliveryDate,
        viewModel.notes,
        viewModel.internalNotes,
        viewModel.paymentInstallments,
        viewModel.deliveryMethod
      )

      if (!sale.isValid()) {
        return { success: false, data: null, message: 'Dados da venda são inválidos' }
      }

      const result = await this.salesRepository.create(sale)
      return result.success 
        ? { success: true, data: result.data, message: 'Venda criada com sucesso' }
        : { success: false, data: null, message: 'Erro ao criar venda' }
    } catch (error) {
      console.error('Error in CreateSaleUseCase:', error)
      return { success: false, data: null, message: 'Erro interno ao criar venda' }
    }
  }
}