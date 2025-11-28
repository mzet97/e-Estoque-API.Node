import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCompaniesUseCase from './ListCompaniesUseCase'
import ListCompaniesViewModel from '../../viewModels/ListCompaniesViewModel'
import { CompanyFilters } from '../../repositories/ICompaniesRepository'

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: List all companies
 *     description: Returns a paginated list of companies with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Company name filter
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *         description: Company email filter
 *       - in: query
 *         name: docId
 *         schema: { type: string }
 *         description: Company document ID (CNPJ/CPF) filter
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 20 }
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, default: createdAt }
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
 *                 data: { $ref: '#/components/schemas/PagedResult' }
 *                 message: { type: string, example: "Empresas listadas com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
