import { container } from 'tsyringe'
import ISalesRepository from '../repositories/ISalesRepository'
import SalesRepository from '../repositories/SalesRepository'

container.registerSingleton<ISalesRepository>('SalesRepository', SalesRepository)