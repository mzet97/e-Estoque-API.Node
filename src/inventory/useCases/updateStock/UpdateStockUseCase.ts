import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IInventoryRepository from '../../repositories/IInventoryRepository'
import { MovementType } from '../../entities/Inventory'

export interface UpdateStockViewModel {
  productId: string
  companyId: string
  operation: 'ADD' | 'REMOVE' | 'RESERVE' | 'RELEASE' | 'CONFIRM' | 'ADJUST'
  quantity: number
  userId: string
  reason?: string
  referenceId?: string
  referenceType?: string
  unitCost?: number
  unitPrice?: number
  location?: string
  notes?: string
}

@injectable()
export default class UpdateStockUseCase implements IUseCase<UpdateStockViewModel, any> {
  constructor(
    @inject('InventoryRepository')
    private inventoryRepository: IInventoryRepository,
  ) {}

  async execute(viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      const operation = viewModel.operation
      
      // Buscar estoque atual
      const stockResult = await this.inventoryRepository.findStockByProduct(viewModel.productId)
      if (!stockResult.success) {
        return {
          success: false,
          data: null,
          message: 'Estoque não encontrado para o produto'
        }
      }

      const stock = stockResult.data!

      let stockUpdateResult
      let movementResult

      switch (operation) {
        case 'ADD':
          stockUpdateResult = await this.performAddOperation(stock, viewModel)
          movementResult = await this.createMovement(stock, viewModel, MovementType.IN)
          break

        case 'REMOVE':
          stockUpdateResult = await this.performRemoveOperation(stock, viewModel)
          movementResult = await this.createMovement(stock, viewModel, MovementType.OUT)
          break

        case 'RESERVE':
          stockUpdateResult = await this.performReserveOperation(stock, viewModel)
          movementResult = await this.createMovement(stock, viewModel, MovementType.OUT)
          break

        case 'RELEASE':
          stockUpdateResult = await this.performReleaseOperation(stock, viewModel)
          movementResult = await this.createMovement(stock, viewModel, MovementType.IN)
          break

        case 'CONFIRM':
          stockUpdateResult = await this.performConfirmOperation(stock, viewModel)
          // Não cria movimento para confirmação de venda
          break

        case 'ADJUST':
          stockUpdateResult = await this.performAdjustOperation(stock, viewModel)
          movementResult = await this.createMovement(stock, viewModel, 
            viewModel.quantity >= 0 ? MovementType.IN : MovementType.OUT)
          break

        default:
          return {
            success: false,
            data: null,
            message: 'Operação não reconhecida'
          }
      }

      if (!stockUpdateResult.success) {
        return stockUpdateResult
      }

      // Atualizar status de risco do estoque
      stockUpdateResult.data!.updateRiskLevel()
      await this.inventoryRepository.updateStock(stockUpdateResult.data!.id, {
        stockoutRiskLevel: stockUpdateResult.data!.stockoutRiskLevel
      })

      // Simular notificação em tempo real
      await this.notifyStockUpdate(viewModel, stockUpdateResult.data!)

      return {
        success: true,
        data: {
          stock: stockUpdateResult.data!,
          movement: movementResult?.data || null,
          operation: viewModel.operation,
          timestamp: new Date(),
          previousQuantity: stock.totalQuantity,
          newQuantity: stockUpdateResult.data!.totalQuantity,
          previousAvailable: stock.availableQuantity,
          newAvailable: stockUpdateResult.data!.availableQuantity,
          stockLevel: stockUpdateResult.data!.getStockStatus()
        },
        message: `Estoque ${viewModel.operation.toLowerCase()} realizado com sucesso`
      }
    } catch (error) {
      console.error('Error in UpdateStockUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao atualizar estoque'
      }
    }
  }

  private async performAddOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      // Adicionar quantidade ao estoque
      stock.addStock(viewModel.quantity, viewModel.unitCost)
      stock.lastMovementDate = new Date()
      
      // Atualizar data da última compra se unitCost foi fornecido
      if (viewModel.unitCost) {
        stock.lastPurchaseDate = new Date()
      }

      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Estoque adicionado com sucesso'
      }
    } catch (error) {
      console.error('Error adding stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao adicionar estoque'
      }
    }
  }

  private async performRemoveOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      // Verificar se há estoque suficiente
      if (!stock.allowNegativeStock && stock.availableQuantity < viewModel.quantity) {
        return {
          success: false,
          data: null,
          message: 'Estoque insuficiente para remoção'
        }
      }

      // Remover quantidade do estoque
      const removed = stock.removeStock(viewModel.quantity)
      
      if (!removed && !stock.allowNegativeStock) {
        return {
          success: false,
          data: null,
          message: 'Falha ao remover estoque'
        }
      }

      stock.lastMovementDate = new Date()
      stock.lastSaleDate = new Date()

      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Estoque removido com sucesso'
      }
    } catch (error) {
      console.error('Error removing stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao remover estoque'
      }
    }
  }

  private async performReserveOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      const reserved = stock.reserve(viewModel.quantity)
      
      if (!reserved) {
        return {
          success: false,
          data: null,
          message: 'Estoque insuficiente para reserva'
        }
      }

      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Estoque reservado com sucesso'
      }
    } catch (error) {
      console.error('Error reserving stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao reservar estoque'
      }
    }
  }

  private async performReleaseOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      stock.release(viewModel.quantity)
      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Reserva liberada com sucesso'
      }
    } catch (error) {
      console.error('Error releasing stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao liberar reserva'
      }
    }
  }

  private async performConfirmOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      const confirmed = stock.confirmSale(viewModel.quantity)
      
      if (!confirmed) {
        return {
          success: false,
          data: null,
          message: 'Nenhuma reserva encontrada para confirmar'
        }
      }

      stock.lastMovementDate = new Date()
      stock.lastSaleDate = new Date()

      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Venda confirmada com sucesso'
      }
    } catch (error) {
      console.error('Error confirming stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao confirmar venda'
      }
    }
  }

  private async performAdjustOperation(stock: any, viewModel: UpdateStockViewModel): Promise<IResult<any>> {
    try {
      const adjustmentQuantity = viewModel.quantity
      const reason = viewModel.reason || 'Ajuste manual'

      stock.adjustStock(adjustmentQuantity, reason)
      stock.lastMovementDate = new Date()

      const updatedStock = await this.inventoryRepository.updateStock(stock.id, stock)
      return {
        success: true,
        data: stock,
        message: 'Ajuste de estoque realizado com sucesso'
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao ajustar estoque'
      }
    }
  }

  private async createMovement(stock: any, viewModel: UpdateStockViewModel, movementType: MovementType): Promise<IResult<any>> {
    try {
      const reason = this.mapOperationToReason(viewModel.operation)
      
      const movement = {
        productId: viewModel.productId,
        companyId: viewModel.companyId,
        userId: viewModel.userId,
        movementType,
        movementReason: reason,
        quantity: Math.abs(viewModel.quantity),
        previousQuantity: stock.totalQuantity - (movementType === MovementType.IN ? Math.abs(viewModel.quantity) : -Math.abs(viewModel.quantity)),
        currentQuantity: stock.totalQuantity,
        referenceId: viewModel.referenceId,
        referenceType: viewModel.referenceType,
        unitCost: viewModel.unitCost,
        unitPrice: viewModel.unitPrice,
        location: viewModel.location,
        notes: viewModel.notes || `Movimento via ${viewModel.operation}`
      }

      const result = await this.inventoryRepository.createMovement(movement as any)
      return result
    } catch (error) {
      console.error('Error creating movement:', error)
      return {
        success: false,
        data: null,
        message: 'Erro ao criar movimento de estoque'
      }
    }
  }

  private mapOperationToReason(operation: string): any {
    const reasonMap: Record<string, any> = {
      'ADD': 'PRODUCTION',
      'REMOVE': 'SALE',
      'RESERVE': 'SALE',
      'RELEASE': 'RETURN_FROM_CUSTOMER',
      'CONFIRM': 'SALE',
      'ADJUST': 'ADJUSTMENT_POSITIVE'
    }
    return reasonMap[operation] || 'ADJUSTMENT_POSITIVE'
  }

  private async notifyStockUpdate(viewModel: UpdateStockViewModel, updatedStock: any): Promise<void> {
    try {
      // Em uma implementação real, aqui seria enviado para WebSocket
      const notification = {
        type: 'STOCK_UPDATE',
        productId: viewModel.productId,
        companyId: viewModel.companyId,
        operation: viewModel.operation,
        quantity: viewModel.quantity,
        newStockLevel: updatedStock.totalQuantity,
        availableStock: updatedStock.availableQuantity,
        reservedStock: updatedStock.reservedQuantity,
        stockStatus: updatedStock.getStockStatus(),
        timestamp: new Date(),
        userId: viewModel.userId,
        isLowStock: updatedStock.isLowStock(),
        isOutOfStock: updatedStock.isOutOfStock(),
        needsReorder: updatedStock.needsReorder()
      }

      // Simular logging da notificação
      console.log('Stock Update Notification:', notification)

      // Em uma implementação real:
      // - WebSocketServer.emit('stock-update', notification)
      // - Redis.publish('stock-updates', JSON.stringify(notification))
      // - Send to message queue for real-time processing

    } catch (error) {
      console.error('Error notifying stock update:', error)
      // Não falhar a operação principal se a notificação falhar
    }
  }
}

export { UpdateStockUseCase }