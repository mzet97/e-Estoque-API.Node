import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCustomerUseCase from '../useCases/getCustomer/GetCustomerUseCase'
import ShowCustomerViewModel from '../viewModels/ShowCustomerViewModel'

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     description: Returns a single customer by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Customer unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: includeAddress
 *         schema: { type: boolean, default: false }
 *         description: Include customer address in response
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
 *                   $ref: '#/components/schemas/Customer'
 *                 message: { type: string, example: "Cliente encontrado" }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class GetCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const getCustomerUseCase = container.resolve(GetCustomerUseCase)
    const viewModel = {
      customerId: request.params.id,
      includeAddress: request.query.includeAddress === 'true'
    }

    console.log('GetCustomerController.handle:', { id: viewModel.customerId, includeAddress: viewModel.includeAddress })
    
    const result = await getCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('GetCustomerController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'GET_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('GetCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}