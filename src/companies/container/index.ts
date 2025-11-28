import { container } from 'tsyringe'
import ICompaniesRepository from '../repositories/ICompaniesRepository'
import CompaniesRepository from '../repositories/CompaniesRepository'

// Register Companies Repository
container.registerSingleton<ICompaniesRepository>('CompaniesRepository', CompaniesRepository)
