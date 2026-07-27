import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => () => {},
  container: { resolve: jest.fn() }
}))

import GetInventoryStatisticsUseCase from '../../../inventory/useCases/getStatistics/GetInventoryStatisticsUseCase'

describe('GetInventoryStatisticsUseCase', () => {
  let useCase: GetInventoryStatisticsUseCase
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      findStocksByCompany: jest.fn(),
      findMovementsByCompany: jest.fn()
    }
    useCase = new GetInventoryStatisticsUseCase(mockRepository)
  })

  it('should return statistics successfully', async () => {
    ;(mockRepository.findStocksByCompany as any).mockResolvedValue({
      success: true,
      data: [
        { totalQuantity: 100, averageCost: 10, isLowStock: false },
        { totalQuantity: 5, averageCost: 20, isLowStock: true },
        { totalQuantity: 0, averageCost: 0, isLowStock: false }
      ]
    })
    ;(mockRepository.findMovementsByCompany as any).mockResolvedValue({
      success: true,
      data: [
        { movementType: 'IN', quantity: 50, productId: 'p1' },
        { movementType: 'OUT', quantity: 20, productId: 'p1' },
        { movementType: 'IN', quantity: 30, productId: 'p2' }
      ]
    })

    const result = await useCase.execute({ companyId: 'company-1' })

    expect(result.totalProducts).toBe(3)
    expect(result.lowStockProducts).toBe(1)
    expect(result.outOfStockProducts).toBe(1)
    expect(result.totalMovements).toBe(3)
  })

  it('should handle empty data', async () => {
    ;(mockRepository.findStocksByCompany as any).mockResolvedValue({
      success: true,
      data: []
    })
    ;(mockRepository.findMovementsByCompany as any).mockResolvedValue({
      success: true,
      data: []
    })

    const result = await useCase.execute({ companyId: 'company-1' })

    expect(result.totalProducts).toBe(0)
    expect(result.totalQuantity).toBe(0)
    expect(result.totalMovements).toBe(0)
  })
})
