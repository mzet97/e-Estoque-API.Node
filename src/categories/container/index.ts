import { container } from 'tsyringe'
import ICategoriesRepository from '../repositories/ICategoriesRepository'
import CategoriesRepository from '../repositories/CategoriesRepository'

// Register Categories Repository
container.registerSingleton<ICategoriesRepository>('CategoriesRepository', CategoriesRepository)
