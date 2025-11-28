import { container } from 'tsyringe'
import IProductsRepository from '../repositories/IProductsRepository'
import ProductsRepository from '../repositories/ProductsRepository'

// Register Products Repository
container.registerSingleton<IProductsRepository>('ProductsRepository', ProductsRepository)
