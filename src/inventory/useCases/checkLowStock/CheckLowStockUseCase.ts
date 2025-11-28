import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IInventoryRepository from '../../repositories/IInventoryRepository'

export interface CheckLowStockViewModel {
  companyId: string
  includeCritical?: boolean
  includeOutOfStock?: boolean
  includeNearExpiry?: boolean
  location?: string
  warehouseZone?: string
}

@injectable()
export default class CheckLowStockUseCase implements IUseCase<CheckLowStockViewModel, any> {
  constructor(
    @Inject('InventoryRepository')
    private inventoryRepository: IInventoryRepository,
  ) {}

  async execute(viewModel: CheckLowStockViewModel): Promise<IResult<any>> {
    try {
      const alerts: any[] = []

      // Buscar produtos com estoque baixo
      const lowStockResult = await this.inventoryRepository.findLowStockProducts()
      if (lowStockResult.success && lowStockResult.data) {
        for (const stock of lowStockResult.data) {
          // Filtrar por empresa
          if (stock.companyId !== viewModel.companyId) continue

          // Filtrar por localização se especificado
          if (viewModel.location && stock.location !== viewModel.location) continue
          if (viewModel.warehouseZone && stock.warehouseZone !== viewModel.warehouseZone) continue

          // Calcular percentual de estoque
          const percentage = stock.minStockLevel > 0 
            ? (stock.availableQuantity / stock.minStockLevel) * 100 
            : 0

          // Determinar severidade
          let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
          if (stock.availableQuantity <= 0) {
            severity = 'CRITICAL'
          } else if (stock.availableQuantity <= stock.safetyStock) {
            severity = 'HIGH'
          } else if (percentage <= 50) {
            severity = 'MEDIUM'
          }

          // Só incluir alertas críticos se solicitado
          if (!viewModel.includeCritical && severity === 'CRITICAL' && stock.availableQuantity <= 0) {
            continue
          }

          alerts.push({
            id: `low_stock_${stock.id}`,
            type: 'LOW_STOCK',
            severity,
            productId: stock.productId,
            companyId: stock.companyId,
            currentQuantity: stock.availableQuantity,
            minStockLevel: stock.minStockLevel,
            reorderPoint: stock.reorderPoint,
            safetyStock: stock.safetyStock,
            stockPercentage: percentage,
            location: stock.location,
            warehouseZone: stock.warehouseZone,
            message: this.generateLowStockMessage(stock, severity),
            recommendation: this.generateReorderRecommendation(stock),
            createdAt: new Date(),
            isActive: true,
            acknowledged: false
          })
        }
      }

      // Buscar produtos sem estoque se solicitado
      if (viewModel.includeOutOfStock) {
        const outOfStockResult = await this.inventoryRepository.findOutOfStockProducts()
        if (outOfStockResult.success && outOfStockResult.data) {
          for (const stock of outOfStockResult.data) {
            if (stock.companyId !== viewModel.companyId) continue
            if (viewModel.location && stock.location !== viewModel.location) continue
            if (viewModel.warehouseZone && stock.warehouseZone !== viewModel.warehouseZone) continue

            alerts.push({
              id: `out_of_stock_${stock.id}`,
              type: 'OUT_OF_STOCK',
              severity: 'CRITICAL',
              productId: stock.productId,
              companyId: stock.companyId,
              currentQuantity: stock.availableQuantity,
              minStockLevel: stock.minStockLevel,
              reorderPoint: stock.reorderPoint,
              safetyStock: stock.safetyStock,
              stockPercentage: 0,
              location: stock.location,
              warehouseZone: stock.warehouseZone,
              message: `PRODUTO SEM ESTOQUE: ID ${stock.productId} - Nenhuma unidade disponível`,
              recommendation: 'URGENTE: Reabastecer estoque imediatamente',
              createdAt: new Date(),
              isActive: true,
              acknowledged: false
            })
          }
        }
      }

      // Buscar produtos próximos ao vencimento se solicitado
      if (viewModel.includeNearExpiry) {
        const nearExpiryResult = await this.inventoryRepository.findNearExpiryProducts(30)
        if (nearExpiryResult.success && nearExpiryResult.data) {
          for (const movement of nearExpiryResult.data) {
            if (movement.companyId !== viewModel.companyId) continue
            if (!movement.expiryDate) continue

            const daysUntilExpiry = Math.ceil(
              (movement.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )

            let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
            if (daysUntilExpiry <= 7) {
              severity = 'CRITICAL'
            } else if (daysUntilExpiry <= 15) {
              severity = 'HIGH'
            } else if (daysUntilExpiry <= 30) {
              severity = 'MEDIUM'
            }

            alerts.push({
              id: `near_expiry_${movement.id}`,
              type: 'NEAR_EXPIRY',
              severity,
              productId: movement.productId,
              companyId: movement.companyId,
              expiryDate: movement.expiryDate,
              daysUntilExpiry,
              quantity: movement.quantity,
              location: movement.location,
              warehouseZone: movement.warehouseZone,
              message: `PRODUTO PERTO DO VENCIMENTO: Vence em ${daysUntilExpiry} dias`,
              recommendation: daysUntilExpiry <= 7 
                ? 'URGENTE: Priorizar venda ou descarte'
                : 'Promover venda com desconto',
              createdAt: new Date(),
              isActive: true,
              acknowledged: false
            })
          }
        }
      }

      // Ordenar alertas por severidade
      alerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
      })

      // Resumo dos alertas
      const summary = {
        total: alerts.length,
        byType: {
          LOW_STOCK: alerts.filter(a => a.type === 'LOW_STOCK').length,
          OUT_OF_STOCK: alerts.filter(a => a.type === 'OUT_OF_STOCK').length,
          NEAR_EXPIRY: alerts.filter(a => a.type === 'NEAR_EXPIRY').length
        },
        bySeverity: {
          CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
          HIGH: alerts.filter(a => a.severity === 'HIGH').length,
          MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
          LOW: alerts.filter(a => a.severity === 'LOW').length
        },
        locations: [...new Set(alerts.map(a => a.location).filter(Boolean))],
        warehouseZones: [...new Set(alerts.map(a => a.warehouseZone).filter(Boolean))]
      }

      return {
        success: true,
        data: {
          alerts,
          summary
        },
        message: 'Verificação de estoque baixo concluída'
      }
    } catch (error) {
      console.error('Error in CheckLowStockUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao verificar estoque baixo'
      }
    }
  }

  private generateLowStockMessage(stock: any, severity: string): string {
    const percentage = stock.minStockLevel > 0 
      ? (stock.availableQuantity / stock.minStockLevel) * 100 
      : 0

    const baseMessage = `ESTOQUE BAIXO: ${stock.availableQuantity} unidades (Mín: ${stock.minStockLevel})`
    
    if (severity === 'CRITICAL') {
      return `🚨 ${baseMessage} - SEM ESTOQUE DISPONÍVEL`
    } else if (severity === 'HIGH') {
      return `⚠️ ${baseMessage} - Abaixo do estoque de segurança (${stock.safetyStock})`
    } else if (severity === 'MEDIUM') {
      return `📦 ${baseMessage} - ${percentage.toFixed(1)}% do nível mínimo`
    } else {
      return `📊 ${baseMessage} - ${percentage.toFixed(1)}% do nível mínimo`
    }
  }

  private generateReorderRecommendation(stock: any): string {
    if (stock.availableQuantity <= 0) {
      return `URGENTE: Reabastecer ${stock.minStockLevel * 2} unidades`
    }

    const suggestedQuantity = Math.max(
      stock.reorderPoint - stock.availableQuantity,
      stock.minStockLevel * 2
    )

    if (stock.leadTimeDays > 0) {
      return `Reabastecer ${suggestedQuantity} unidades (Lead time: ${stock.leadTimeDays} dias)`
    }

    return `Reabastecer ${suggestedQuantity} unidades`
  }
}

export { CheckLowStockUseCase }