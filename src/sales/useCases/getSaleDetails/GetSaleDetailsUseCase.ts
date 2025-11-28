import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ISalesRepository from '../../repositories/ISalesRepository'
import Sale from '../../entities/Sale'

export interface GetSaleDetailsViewModel {
  saleId: string
}

@injectable()
export default class GetSaleDetailsUseCase implements IUseCase<GetSaleDetailsViewModel, Sale> {
  constructor(
    @inject('SalesRepository')
    private salesRepository: ISalesRepository,
  ) {}

  async execute(viewModel: GetSaleDetailsViewModel): Promise<IResult<Sale>> {
    try {
      // Buscar venda com detalhes completos
      const result = await this.salesRepository.findSaleWithDetails(viewModel.saleId)
      
      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Venda não encontrada'
        }
      }

      const sale = result.data!

      // Validações de negócio
      if (!sale.isActive()) {
        return {
          success: false,
          data: null,
          message: 'Venda foi removida'
        }
      }

      // Adicionar informações calculadas à resposta
      const saleWithCalculations = {
        ...sale,
        profit: sale.calculateProfit(),
        profitMargin: sale.calculateProfitMargin(),
        daysSinceSale: sale.getDaysSinceSale(),
        isOverdue: sale.isOverdue(),
        isDueSoon: sale.isDueSoon(),
        canBeEdited: sale.canBeEdited(),
        canBeCancelled: sale.canBeCancelled()
      }

      return {
        success: true,
        data: saleWithCalculations,
        message: 'Detalhes da venda obtidos com sucesso'
      }
    } catch (error) {
      console.error('Error in GetSaleDetailsUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao obter detalhes da venda'
      }
    }
  }
}