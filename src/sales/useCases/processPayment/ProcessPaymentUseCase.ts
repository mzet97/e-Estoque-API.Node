import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import ISalesRepository from '../../repositories/ISalesRepository'
import Sale, { SaleStatus } from '../../entities/Sale'
import SaleProduct from '../../entities/SaleProduct'

export interface ProcessPaymentViewModel {
  saleId: string
  paymentDate?: Date
  transactionId?: string
  paymentNotes?: string
}

@injectable()
export default class ProcessPaymentUseCase implements IUseCase<ProcessPaymentViewModel, Sale> {
  constructor(
    @inject('SalesRepository')
    private salesRepository: ISalesRepository,
  ) {}

  async execute(viewModel: ProcessPaymentViewModel): Promise<IResult<Sale>> {
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

      // Validações de negócio
      if (!sale.isActive()) {
        return {
          success: false,
          data: null,
          message: 'Venda foi removida'
        }
      }

      if (sale.isCancelled() || sale.isRefunded() || sale.isReturned()) {
        return {
          success: false,
          data: null,
          message: 'Não é possível processar pagamento de venda cancelada, devolvida ou reembolsada'
        }
      }

      if (sale.status === SaleStatus.COMPLETED) {
        return {
          success: false,
          data: null,
          message: 'Pagamento desta venda já foi processado'
        }
      }

      // Verificar se é venda de crédito ou precisa aguardar confirmação de pagamento
      if (sale.isCreditSale()) {
        // Para vendas a crédito, apenas confirmar que o pagamento foi registrado
        sale.status = SaleStatus.CONFIRMED
      } else {
        // Para vendas à vista, marcar como completa após confirmação de pagamento
        sale.status = SaleStatus.COMPLETED
      }

      // Atualizar data de pagamento se fornecida
      if (viewModel.paymentDate) {
        sale.paymentDueDate = viewModel.paymentDate
      }

      // Adicionar notas de pagamento
      if (viewModel.paymentNotes) {
        sale.notes = sale.notes 
          ? `${sale.notes}\n\nPagamento: ${viewModel.paymentNotes}`
          : `Pagamento: ${viewModel.paymentNotes}`
      }

      // Recalcular valor líquido
      sale.calculateNetAmount()

      // Atualizar no banco
      const updateResult = await this.salesRepository.update(sale.id, sale)

      if (!updateResult.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao atualizar venda após processamento de pagamento'
        }
      }

      // Confirmar vendas de estoque se a venda foi completada
      if (sale.status === SaleStatus.COMPLETED) {
        await this.confirmInventoryForSale(sale.id)
      }

      return {
        success: true,
        data: updateResult.data!,
        message: 'Pagamento processado com sucesso'
      }
    } catch (error) {
      console.error('Error in ProcessPaymentUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao processar pagamento'
      }
    }
  }

  private async confirmInventoryForSale(saleId: string): Promise<void> {
    try {
      // Buscar produtos da venda
      const saleWithProducts = await this.salesRepository.findSaleWithProducts(saleId)
      
      if (saleWithProducts.success && saleWithProducts.data) {
        // Simular confirmação de estoque (implementar com repositório de inventory)
        console.log(`Confirming inventory for sale ${saleId}`)
        
        // Aqui seria implementado:
        // - Buscar itens de estoque para cada produto
        // - Confirmar a venda (diminuir estoque)
        // - Liberar reservas
      }
    } catch (error) {
      console.error('Error confirming inventory for sale:', error)
    }
  }
}