import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCustomersUseCase from '../useCases/listCustomers/ListCustomersUseCase'
import ListCustomersViewModel from '../viewModels/ListCustomersViewModel'

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List all customers
 *     description: Returns a paginated list of customers with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by customer name
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *         description: Filter by email
 *       - in: query
 *         name: docId
 *         schema: { type: string }
 *         description: Filter by document ID (CPF/CNPJ)
 *       - in: query
 *         name: phoneNumber
 *         schema: { type: string }
 *         description: Filter by phone number
 *       - in: query
 *         name: personType
 *         schema: { type: string, enum: [FISICA, JURIDICA] }
 *         description: Filter by person type
 *       - in: query
 *         name: hasAddress
 *         schema: { type: boolean }
 *         description: Filter by whether customer has address
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term for name, email or document
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
 *         schema: { type: string, enum: [name, email, createdAt, updatedAt], default: createdAt }
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
 *                 message: { type: string, example: "Clientes listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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