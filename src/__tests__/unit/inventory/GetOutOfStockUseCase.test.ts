import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => () => {},
  container: { resolve: jest.fn() }
}))

import GetOutOfStockUseCase from '../../../inventory/useCases/getOutOfStock/GetOutOfStockUseCase'

describe('GetOutOfStockUseCase', () => {
  let useCase: GetOutOfStockUseCase
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      findStocksWithFilters: jest.fn()
    }
    useCase = new GetOutOfStockUseCase(mockRepository)
  })

  it('should return out of stock products', async () => {
    const mockResult = {
      success: true,
      data: [
        { id: 'stock-1', totalQuantity: 0, product: { name: 'Product A' } },
        { id: 'stock-2', totalQuantity: 0, product: { name: 'Product B' } }
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }
    }

    ;(mockRepository.findStocksWithFilters as any).mockResolvedValue(mockResult)

    const result = await useCase.execute({ companyId: 'company-1' })

    expect(result.data).toHaveLength(2)
    expect(result.pagination.totalItems).toBe(2)
  })

  it('should pass pagination parameters correctly', async () => {
    ;(mockRepository.findStocksWithFilters as any).mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 }
    })

    await useCase.execute({ companyId: 'company-1', page: 2, pageSize: 10 })

    expect(mockRepository.findStocksWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        page: 2,
        pageSize: 10,
        maxTotalQuantity: 0
      })
    )
  })
})
