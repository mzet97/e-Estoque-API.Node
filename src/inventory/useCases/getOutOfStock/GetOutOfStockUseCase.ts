import { injectable, inject } from 'tsyringe'
import IInventoryRepository from '../../repositories/IInventoryRepository'

interface OutOfStockRequest {
  companyId: string
  location?: string
  warehouseZone?: string
  page?: number
  pageSize?: number
}

@injectable()
export default class GetOutOfStockUseCase {
  constructor(
    @inject('InventoriesRepository')
    private inventoryRepository: IInventoryRepository
  ) {}

  async execute({ companyId, location, warehouseZone, page = 1, pageSize = 20 }: OutOfStockRequest) {
    // Buscar estoques com quantidade zero
    const result = await this.inventoryRepository.findStocksWithFilters({
      companyId,
      location,
      warehouseZone,
      maxTotalQuantity: 0,
      page,
      pageSize,
      orderBy: 'totalQuantity',
      orderDirection: 'ASC'
    })

    return result
  }
}
