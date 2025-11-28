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

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     description: Returns a paginated list of categories with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 20 }
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term for name or description
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [name, createdAt, level], default: createdAt }
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
 *                 message: { type: string, example: "Categorias listadas com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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