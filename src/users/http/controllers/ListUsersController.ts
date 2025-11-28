import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListUsersUseCase from '../../useCases/listUsers/ListUsersUseCase'
import { UserFilters } from '../../repositories/IUsersRepository'
import UserViewModel from '../../viewModels/UserViewModel'

export default class ListUsersController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listUsersUseCase = container.resolve(ListUsersUseCase)
    
    // Extrair filtros da query string
    const filters: UserFilters = {
      name: request.query.name as string,
      email: request.query.email as string,
      firstName: request.query.firstName as string,
      lastName: request.query.lastName as string,
      phoneNumber: request.query.phoneNumber as string,
      roleId: request.query.roleId as string,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      isVerified: request.query.isVerified ? request.query.isVerified === 'true' : undefined,
      hasAvatar: request.query.hasAvatar ? request.query.hasAvatar === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListUsersController.handle:', { filters })
    
    const result = await listUsersUseCase.execute(filters)

    if (!result.success) {
      console.error('ListUsersController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_USERS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: UserViewModel.fromUserList(result.data)
    }

    console.log('ListUsersController.handle:', { 
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message 
    })
    
    response.status(200).json(viewModelResult)
  }
}