import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ISalesRepository from '../../repositories/ISalesRepository'
import Sale, { SaleStatus } from '../../entities/Sale'

export interface CancelSaleViewModel {
  saleId: string
  cancellationReason?: string
  refundAmount?: number
  refundDate?: Date
  cancellationNotes?: string
}

@injectable()
export default class CancelSaleUseCase implements IUseCase<CancelSaleViewModel, Sale> {
  constructor(
    @inject('SalesRepository')
    private salesRepository: ISalesRepository,
  ) {}

  async execute(viewModel: CancelSaleViewModel): Promise<IResult<Sale>> {
    try {
      // Buscar venda com detalhes
      const saleResult = await this.salesRepository.findSaleWithDetails(viewModel.saleId)
      
      if (!saleResult.success) {
        return {
          success: false,
          data: null,
          message: 'Venda não encontrada'
        }
      }

      const sale = saleResult.data!

      // Validações de negócio para cancelamento
      if (!sale.canBeCancelled()) {
        return {
          success: false,
          data: null,
          message: 'Esta venda não pode ser cancelada (já foi cancelada, reembolsada ou devolvida)'
        }
      }

      if (sale.status === SaleStatus.COMPLETED) {
        return {
          success: false,
          data: null,
          message: 'Vendas completadas precisam ser devolvidas ao invés de canceladas'
        }
      }

      // Determinar o novo status
      let newStatus: SaleStatus
      if (sale.status === SaleStatus.CONFIRMED || sale.status === SaleStatus.IN_PROGRESS) {
        newStatus = SaleStatus.CANCELLED
      } else {
        // Para vendas pendentes, apenas marcar como cancelada
        newStatus = SaleStatus.CANCELLED
      }

      // Atualizar status da venda
      sale.status = newStatus

      // Adicionar motivo de cancelamento
      if (viewModel.cancellationReason || viewModel.cancellationNotes) {
        const cancellationText = [
          viewModel.cancellationReason ? `Motivo: ${viewModel.cancellationReason}` : '',
          viewModel.cancellationNotes ? `Observações: ${viewModel.cancellationNotes}` : ''
        ].filter(Boolean).join(' | ')

        sale.notes = sale.notes 
          ? `${sale.notes}\n\nCancelamento: ${cancellationText}`
          : `Cancelamento: ${cancellationText}`
      }

      // Atualizar data de cancelamento (seria um campo adicional no Sale)
      sale.updatedAt = new Date()

      // Liberar estoque reservado se a venda estava confirmada
      if (sale.status === SaleStatus.CONFIRMED) {
        await this.releaseInventoryForSale(sale.id)
      }

      // Atualizar no banco
      const updateResult = await this.salesRepository.update(sale.id, sale)

      if (!updateResult.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao atualizar venda após cancelamento'
        }
      }

      return {
        success: true,
        data: updateResult.data!,
        message: 'Venda cancelada com sucesso'
      }
    } catch (error) {
      console.error('Error in CancelSaleUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao cancelar venda'
      }
    }
  }

  private async releaseInventoryForSale(saleId: string): Promise<void> {
    try {
      // Buscar produtos da venda
      const saleWithProducts = await this.salesRepository.findSaleWithProducts(saleId)
      
      if (saleWithProducts.success && saleWithProducts.data) {
        // Simular liberação de estoque (implementar com repositório de inventory)
        console.log(`Releasing inventory for cancelled sale ${saleId}`)
        
        // Aqui seria implementado:
        // - Buscar itens de estoque para cada produto
        // - Liberar quantidade reservada
        // - Atualizar disponibilidade
      }
    } catch (error) {
      console.error('Error releasing inventory for cancelled sale:', error)
    }
  }
}