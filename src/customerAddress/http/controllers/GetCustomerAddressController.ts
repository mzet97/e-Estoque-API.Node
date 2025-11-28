import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetCustomerAddressUseCase from '../../useCases/getCustomerAddress/GetCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

/**
 * @swagger
 * /customer-addresses/{id}:
 *   get:
 *     tags: [Customer Addresses]
 *     summary: Get customer address by ID
 *     description: Returns a single customer address by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Customer address unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: includeCustomer
 *         schema: { type: boolean, default: true }
 *         description: Include customer data in response
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
 *                   $ref: '#/components/schemas/CustomerAddress'
 *                 message: { type: string, example: "Endereço do cliente encontrado" }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class GetCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCustomer = request.query.includeCustomer !== 'false'
    const getCustomerAddressUseCase = container.resolve(GetCustomerAddressUseCase)
    
    const result = await getCustomerAddressUseCase.execute(id)

    if (!result.success) {
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CUSTOMER_ADDRESS_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data, includeCustomer)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}