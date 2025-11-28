import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListCustomerAddressesUseCase from '../../useCases/listCustomerAddresses/ListCustomerAddressesUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

/**
 * @swagger
 * /customer-addresses:
 *   get:
 *     tags: [Customer Addresses]
 *     summary: List all customer addresses
 *     description: Returns a paginated list of customer addresses with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema: { type: string, format: uuid }
 *         description: Filter by customer ID
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [RESIDENTIAL, COMMERCIAL, BILLING, DELIVERY] }
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
 *         name: isDefault
 *         schema: { type: boolean }
 *         description: Filter by default address status
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
 *                 message: { type: string, example: "Endereços do cliente listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListCustomerAddressesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCustomerAddressesUseCase = container.resolve(ListCustomerAddressesUseCase)
    
    const filters = {
      customerId: request.query.customerId as string,
      type: request.query.type as any,
      city: request.query.city as string,
      state: request.query.state as string,
      isDefault: request.query.isDefault ? request.query.isDefault === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }
    
    const result = await listCustomerAddressesUseCase.execute(filters)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_CUSTOMER_ADDRESSES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: CustomerAddressViewModel.fromCustomerAddressList(result.data)
    }
    
    response.status(200).json(viewModelResult)
  }
}