import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCompaniesUseCase from './ListCompaniesUseCase'
import ListCompaniesViewModel from '../../viewModels/ListCompaniesViewModel'
import { CompanyFilters } from '../../repositories/ICompaniesRepository'

export default class ListCompaniesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCompaniesUseCase = container.resolve(ListCompaniesUseCase)
    
    // Extrair filtros da query string
    const filters: CompanyFilters = {
      name: request.query.name as string,
      email: request.query.email as string,
      docId: request.query.docId as string,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListCompaniesController.handle:', { filters })
    
    const result = await listCompaniesUseCase.execute(filters)

    if (!result.success) {
      console.error('ListCompaniesController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_COMPANIES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ListCompaniesViewModel.fromPaginationResult(result)

    console.log('ListCompaniesController.handle:', { 
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
