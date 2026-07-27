import { injectable, inject } from 'tsyringe'
import IInventoryRepository from '../../repositories/IInventoryRepository'

interface ExpiredRequest {
  companyId: string
  daysAhead?: number
  page?: number
  pageSize?: number
}

@injectable()
export default class GetExpiredProductsUseCase {
  constructor(
    @inject('InventoriesRepository')
    private inventoryRepository: IInventoryRepository
  ) {}

  async execute({ companyId, daysAhead = 30, page = 1, pageSize = 20 }: ExpiredRequest) {
    // Buscar produtos com estoque que expira nos próximos N dias
    const result = await this.inventoryRepository.findStocksWithFilters({
      companyId,
      hasExpiredItems: true,
      page,
      pageSize,
      orderBy: 'lastMovementDate',
      orderDirection: 'ASC'
    })

    return result
  }
}
