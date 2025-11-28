import { container } from 'tsyringe'
import CustomerAddressesRepository from '../repositories/CustomerAddressesRepository'
import CreateCustomerAddressUseCase from '../useCases/createCustomerAddress/CreateCustomerAddressUseCase'
import ListCustomerAddressesUseCase from '../useCases/listCustomerAddresses/ListCustomerAddressesUseCase'
import GetCustomerAddressUseCase from '../useCases/getCustomerAddress/GetCustomerAddressUseCase'
import UpdateCustomerAddressUseCase from '../useCases/updateCustomerAddress/UpdateCustomerAddressUseCase'
import DeleteCustomerAddressUseCase from '../useCases/deleteCustomerAddress/DeleteCustomerAddressUseCase'

container.registerSingleton('CustomerAddressesRepository', CustomerAddressesRepository)
container.register('CreateCustomerAddressUseCase', CreateCustomerAddressUseCase)
container.register('ListCustomerAddressesUseCase', ListCustomerAddressesUseCase)
container.register('GetCustomerAddressUseCase', GetCustomerAddressUseCase)
container.register('UpdateCustomerAddressUseCase', UpdateCustomerAddressUseCase)
container.register('DeleteCustomerAddressUseCase', DeleteCustomerAddressUseCase)

export { container }