import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCategoriesUseCase from './ListCategoriesUseCase'

export interface ListCategoriesQuery {
  page?: string
  pageSize?: string
  search?: string
  isActive?: string
  orderBy?: string
  orderDirection?: string
}

export default class ListCategoriesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const query = request.query as ListCategoriesQuery
    const listCategoriesUseCase = container.resolve(ListCategoriesUseCase)

    console.log('ListCategoriesController.handle:', { 
      page: query.page, 
      pageSize: query.pageSize, 
      search: query.search 
    })
    
    const filters = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      searchTerm: query.search,
      isActive: query.isActive === 'true',
      orderBy: (query.orderBy as any) || 'name',
      orderDirection: (query.orderDirection as any) || 'ASC'
    }

    const result = await listCategoriesUseCase.execute(filters)

    if (!result.success) {
      console.error('ListCategoriesController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_CATEGORIES_ERROR', message: result.message }]
      })
      return
    }

    console.log('ListCategoriesController.handle:', { 
      total: result.data.total,
      page: filters.page,
      pageSize: filters.pageSize
    })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}