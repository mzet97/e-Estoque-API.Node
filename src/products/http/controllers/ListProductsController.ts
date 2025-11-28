import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListProductsUseCase from './ListProductsUseCase'

export interface ListProductsQuery {
  page?: string
  pageSize?: string
  search?: string
  categoryId?: string
  companyId?: string
  isActive?: string
  minPrice?: string
  maxPrice?: string
  orderBy?: string
  orderDirection?: string
}

export default class ListProductsController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const query = request.query as ListProductsQuery
    const listProductsUseCase = container.resolve(ListProductsUseCase)

    console.log('ListProductsController.handle:', { 
      page: query.page, 
      pageSize: query.pageSize, 
      search: query.search 
    })
    
    const filters = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      searchTerm: query.search,
      categoryId: query.categoryId,
      companyId: query.companyId,
      isActive: query.isActive === 'true',
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      orderBy: (query.orderBy as any) || 'createdAt',
      orderDirection: (query.orderDirection as any) || 'DESC'
    }

    const result = await listProductsUseCase.execute(filters)

    if (!result.success) {
      console.error('ListProductsController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_PRODUCTS_ERROR', message: result.message }]
      })
      return
    }

    console.log('ListProductsController.handle:', { 
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