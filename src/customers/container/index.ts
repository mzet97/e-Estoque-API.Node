import { container } from 'tsyringe'
import ICustomersRepository from '../repositories/ICustomersRepository'
import CustomersRepository from '../repositories/CustomersRepository'

// Register Customers Repository
container.registerSingleton<ICustomersRepository>('CustomersRepository', CustomersRepository)