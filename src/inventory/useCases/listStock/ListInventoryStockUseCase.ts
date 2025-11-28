import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUseCase from '@shared/useCases/IUseCase'
import InventoriesRepository from '../../repositories/InventoriesRepository'
import { StockFilters } from '../../repositories/IInventoryRepository'

export default class ListInventoryStockUseCase implements IUseCase {
  private inventoriesRepository: InventoriesRepository

  constructor() {
    this.inventoriesRepository = new InventoriesRepository()
  }

  async execute(filters: StockFilters): Promise<IPaginationResult<any>> {
    try {
      console.log('ListInventoryStockUseCase.execute:', { filters })

      const result = await this.inventoriesRepository.findStocksWithFilters(filters)

      if (!result.success) {
        console.error('ListInventoryStockUseCase.execute:', { message: result.message })
        return {
          success: false,
          message: result.message,
          data: [],
          pagination: {
            page: filters.page || 1,
            pageSize: filters.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          }
        }
      }

      console.log('ListInventoryStockUseCase.execute:', {
        totalItems: result.pagination.totalItems,
        message: result.message
      })

      return {
        success: true,
        message: result.message,
        data: result.data,
        pagination: result.pagination
      }
    } catch (error) {
      console.error('ListInventoryStockUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao listar estoques',
        data: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      }
    }
  }
}