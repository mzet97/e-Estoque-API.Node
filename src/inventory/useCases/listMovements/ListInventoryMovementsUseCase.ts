import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUseCase from '@shared/useCases/IUseCase'
import InventoriesRepository from '../../repositories/InventoriesRepository'
import { InventoryFilters } from '../../repositories/IInventoryRepository'

export default class ListInventoryMovementsUseCase implements IUseCase {
  private inventoriesRepository: InventoriesRepository

  constructor() {
    this.inventoriesRepository = new InventoriesRepository()
  }

  async execute(filters: InventoryFilters): Promise<IPaginationResult<any>> {
    try {
      console.log('ListInventoryMovementsUseCase.execute:', { filters })

      const result = await this.inventoriesRepository.findMovementsWithFilters(filters)

      if (!result.success) {
        console.error('ListInventoryMovementsUseCase.execute:', { message: result.message })
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

      console.log('ListInventoryMovementsUseCase.execute:', {
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
      console.error('ListInventoryMovementsUseCase.execute:', error)
      return {
        success: false,
        message: 'Erro interno ao listar movimentos de estoque',
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