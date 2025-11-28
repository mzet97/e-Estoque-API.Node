import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCustomerUseCase from '../useCases/updateCustomer/UpdateCustomerUseCase'
import UpdateCustomerViewModel from '../viewModels/UpdateCustomerViewModel'
import ShowCustomerViewModel from '../viewModels/ShowCustomerViewModel'

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: Update a customer
 *     description: Updates an existing customer with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Customer unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerRequest'
 *           examples:
 *             update_name:
 *               summary: Update name
 *               value:
 *                 name: "João da Silva Santos"
 *             update_phone:
 *               summary: Update phone
 *               value:
 *                 phoneNumber: "(11) 98888-8888"
 *             update_email:
 *               summary: Update email
 *               value:
 *                 email: "joao.novo@email.com"
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
 *                 message: { type: string, example: "Cliente atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class UpdateCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const updateCustomerUseCase = container.resolve(UpdateCustomerUseCase)
    const viewModel = {
      ...request.body,
      customerId: request.params.id
    } as UpdateCustomerViewModel

    console.log('UpdateCustomerController.handle:', { id: viewModel.customerId, name: viewModel.name })
    
    const result = await updateCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('UpdateCustomerController.handle:', { message: result.message })
      const statusCode = result.message.includes('não encontrado') ? 404 : 400
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('UpdateCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}