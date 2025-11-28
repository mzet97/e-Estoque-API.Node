import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCustomerUseCase from '../useCases/deleteCustomer/DeleteCustomerUseCase'
import { DeleteCustomerViewModel } from '../useCases/deleteCustomer/DeleteCustomerUseCase'

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     tags: [Customers]
 *     summary: Delete a customer
 *     description: Deletes a customer by its unique identifier (soft delete by default)
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
 *         name: hardDelete
 *         schema: { type: boolean, default: false }
 *         description: If true, performs hard delete (permanent). If false, performs soft delete.
 *     responses:
 *       204:
 *         description: Success - No Content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: null, example: null }
 *                 message: { type: string, example: "Cliente excluído com sucesso" }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class DeleteCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const deleteCustomerUseCase = container.resolve(DeleteCustomerUseCase)
    const viewModel = new DeleteCustomerViewModel(
      request.params.id,
      request.query.hardDelete === 'true'
    )

    console.log('DeleteCustomerController.handle:', { id: viewModel.customerId, hardDelete: viewModel.hardDelete })
    
    const result = await deleteCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('DeleteCustomerController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCustomerController.handle:', { id: viewModel.customerId, message: result.message })
    
    response.status(204).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}