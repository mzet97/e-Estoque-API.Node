import { container } from 'tsyringe'
import InventoriesRepository from '../repositories/InventoriesRepository'
import ListInventoryMovementsUseCase from '../useCases/listMovements/ListInventoryMovementsUseCase'
import ListInventoryStockUseCase from '../useCases/listStock/ListInventoryStockUseCase'
import GetInventoryStatisticsUseCase from '../useCases/getStatistics/GetInventoryStatisticsUseCase'
import GetOutOfStockUseCase from '../useCases/getOutOfStock/GetOutOfStockUseCase'
import GetExpiredProductsUseCase from '../useCases/getExpiredProducts/GetExpiredProductsUseCase'

// Register repositories
container.registerSingleton('InventoriesRepository', InventoriesRepository)

// Register use cases
container.register('ListInventoryMovementsUseCase', ListInventoryMovementsUseCase)
container.register('ListInventoryStockUseCase', ListInventoryStockUseCase)
container.register('GetInventoryStatisticsUseCase', GetInventoryStatisticsUseCase)
container.register('GetOutOfStockUseCase', GetOutOfStockUseCase)
container.register('GetExpiredProductsUseCase', GetExpiredProductsUseCase)

export { container }