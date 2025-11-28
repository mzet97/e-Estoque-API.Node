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

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     description: Returns a paginated list of products with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 10 }
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term for name, description or SKU
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *         description: Filter by category ID
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filter by company ID
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, minimum: 0 }
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, minimum: 0 }
 *         description: Maximum price filter
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [name, price, createdAt, updatedAt], default: createdAt }
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Order direction
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PagedResult'
 *                 message: { type: string, example: "Produtos listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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