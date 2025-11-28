import { container } from 'tsyringe'
import CompanyAddressesRepository from '../repositories/CompanyAddressesRepository'
import CreateCompanyAddressUseCase from '../useCases/createCompanyAddress/CreateCompanyAddressUseCase'
import ListCompanyAddressesUseCase from '../useCases/listCompanyAddresses/ListCompanyAddressesUseCase'
import GetCompanyAddressUseCase from '../useCases/getCompanyAddress/GetCompanyAddressUseCase'
import UpdateCompanyAddressUseCase from '../useCases/updateCompanyAddress/UpdateCompanyAddressUseCase'
import DeleteCompanyAddressUseCase from '../useCases/deleteCompanyAddress/DeleteCompanyAddressUseCase'

// Register repositories
container.registerSingleton('CompanyAddressesRepository', CompanyAddressesRepository)

// Register use cases
container.register('CreateCompanyAddressUseCase', CreateCompanyAddressUseCase)
container.register('ListCompanyAddressesUseCase', ListCompanyAddressesUseCase)
container.register('GetCompanyAddressUseCase', GetCompanyAddressUseCase)
container.register('UpdateCompanyAddressUseCase', UpdateCompanyAddressUseCase)
container.register('DeleteCompanyAddressUseCase', DeleteCompanyAddressUseCase)

export { container }