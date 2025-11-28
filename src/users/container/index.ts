import { container } from 'tsyringe'
import UsersRepository from '../repositories/UsersRepository'
import CreateUserUseCase from '../useCases/createUser/CreateUserUseCase'
import ListUsersUseCase from '../useCases/listUsers/ListUsersUseCase'
import GetUserUseCase from '../useCases/getUser/GetUserUseCase'
import UpdateUserUseCase from '../useCases/updateUser/UpdateUserUseCase'
import DeleteUserUseCase from '../useCases/deleteUser/DeleteUserUseCase'

// Register repositories
container.registerSingleton('UsersRepository', UsersRepository)

// Register use cases
container.register('CreateUserUseCase', CreateUserUseCase)
container.register('ListUsersUseCase', ListUsersUseCase)
container.register('GetUserUseCase', GetUserUseCase)
container.register('UpdateUserUseCase', UpdateUserUseCase)
container.register('DeleteUserUseCase', DeleteUserUseCase)

export { container }