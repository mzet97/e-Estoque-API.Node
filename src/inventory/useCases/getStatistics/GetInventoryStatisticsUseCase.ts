import { injectable, inject } from 'tsyringe'
import IInventoryRepository from '../../repositories/IInventoryRepository'

interface StatisticsRequest {
  companyId: string
  startDate?: Date
  endDate?: Date
}

@injectable()
export default class GetInventoryStatisticsUseCase {
  constructor(
    @inject('InventoriesRepository')
    private inventoryRepository: IInventoryRepository
  ) {}

  async execute({ companyId, startDate, endDate }: StatisticsRequest) {
    // Buscar estoques da empresa
    const stocksResult = await this.inventoryRepository.findStocksByCompany(companyId)
    const stocks = stocksResult.data || []

    // Buscar movimentos da empresa
    const movementsResult = await this.inventoryRepository.findMovementsByCompany(companyId)
    const movements = movementsResult.data || []

    // Calcular estatísticas
    const totalProducts = stocks.length
    const totalQuantity = stocks.reduce((sum, s) => sum + (s.totalQuantity || 0), 0)
    const totalValue = stocks.reduce((sum, s) => sum + ((s.totalQuantity || 0) * (s.averageCost || 0)), 0)
    const lowStockProducts = stocks.filter(s => s.isLowStock).length
    const outOfStockProducts = stocks.filter(s => s.totalQuantity === 0).length

    // Movimentos por tipo
    const movementsByType = movements.reduce((acc, m) => {
      const type = m.movementType || 'UNKNOWN'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Movimentos por razão
    const movementsByReason = movements.reduce((acc, m) => {
      const reason = m.movementReason || 'UNKNOWN'
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Top produtos com mais movimentação
    const productMovements = movements.reduce((acc, m) => {
      const pid = m.productId
      if (!acc[pid]) {
        acc[pid] = { productId: pid, totalMovements: 0, totalQuantity: 0 }
      }
      acc[pid].totalMovements += 1
      acc[pid].totalQuantity += Math.abs(m.quantity || 0)
      return acc
    }, {} as Record<string, { productId: string; totalMovements: number; totalQuantity: number }>)

    const topMovingProducts = Object.values(productMovements)
      .sort((a, b) => b.totalMovements - a.totalMovements)
      .slice(0, 10)

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      totalInvestment: totalValue,
      lowStockProducts,
      outOfStockProducts,
      expiredProducts: 0,
      damagedProducts: 0,
      movementsByType,
      movementsByReason,
      topMovingProducts,
      totalMovements: movements.length
    }
  }
}
