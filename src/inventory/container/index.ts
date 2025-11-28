import { container } from 'tsyringe'
import InventoriesRepository from '../repositories/InventoriesRepository'
import ListInventoryMovementsUseCase from '../useCases/listMovements/ListInventoryMovementsUseCase'
import ListInventoryStockUseCase from '../useCases/listStock/ListInventoryStockUseCase'

// Register repositories
container.registerSingleton('InventoriesRepository', InventoriesRepository)

// Register use cases
container.register('ListInventoryMovementsUseCase', ListInventoryMovementsUseCase)
container.register('ListInventoryStockUseCase', ListInventoryStockUseCase)

export { container }