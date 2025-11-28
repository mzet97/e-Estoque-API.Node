import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCustomersUseCase from '../useCases/listCustomers/ListCustomersUseCase'
import ListCustomersViewModel from '../viewModels/ListCustomersViewModel'

export default class ListCustomersController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCustomersUseCase = container.resolve(ListCustomersUseCase)
    
    // Extrair filtros da query string
    const viewModel = {
      name: request.query.name as string,
      email: request.query.email as string,
      docId: request.query.docId as string,
      phoneNumber: request.query.phoneNumber as string,
      personType: request.query.personType as any,
      hasAddress: request.query.hasAddress ? request.query.hasAddress === 'true' : undefined,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      search: request.query.search as string,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListCustomersController.handle:', { filters: viewModel })
    
    const result = await listCustomersUseCase.execute(viewModel)

    if (!result.success) {
      console.error('ListCustomersController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_CUSTOMERS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ListCustomersViewModel.fromPaginationResult(result)

    console.log('ListCustomersController.handle:', { 
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}