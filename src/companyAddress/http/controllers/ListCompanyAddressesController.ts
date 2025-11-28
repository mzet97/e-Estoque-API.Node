import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCompanyAddressesUseCase from '../../useCases/listCompanyAddresses/ListCompanyAddressesUseCase'
import { CompanyAddressFilters } from '../../repositories/ICompanyAddressesRepository'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

/**
 * @swagger
 * /company-addresses:
 *   get:
 *     tags: [Company Addresses]
 *     summary: List all company addresses
 *     description: Returns a paginated list of company addresses with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filter by company ID
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [HEADQUARTERS, BRANCH, WAREHOUSE, STORE] }
 *         description: Filter by address type
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *         description: Filter by state
 *       - in: query
 *         name: isHeadquarters
 *         schema: { type: boolean }
 *         description: Filter by headquarters status
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *         description: Filter by department
 *       - in: query
 *         name: contactPerson
 *         schema: { type: string }
 *         description: Filter by contact person
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
 *         schema: { type: string, enum: [city, state, type, createdAt, updatedAt], default: createdAt }
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
 *                 message: { type: string, example: "Endereços da empresa listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListCompanyAddressesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCompanyAddressesUseCase = container.resolve(ListCompanyAddressesUseCase)
    
    // Extrair filtros da query string
    const filters: CompanyAddressFilters = {
      companyId: request.query.companyId as string,
      type: request.query.type as any,
      city: request.query.city as string,
      state: request.query.state as string,
      isHeadquarters: request.query.isHeadquarters ? request.query.isHeadquarters === 'true' : undefined,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      department: request.query.department as string,
      contactPerson: request.query.contactPerson as string,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListCompanyAddressesController.handle:', { filters })
    
    const result = await listCompanyAddressesUseCase.execute(filters)

    if (!result.success) {
      console.error('ListCompanyAddressesController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_COMPANY_ADDRESSES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: CompanyAddressViewModel.fromCompanyAddressList(result.data)
    }

    console.log('ListCompanyAddressesController.handle:', { 
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message 
    })
    
    response.status(200).json(viewModelResult)
  }
}