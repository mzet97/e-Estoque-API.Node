import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import DeleteCustomerAddressUseCase from '../../useCases/deleteCustomerAddress/DeleteCustomerAddressUseCase'

/**
 * @swagger
 * /customer-addresses/{id}:
 *   delete:
 *     tags: [Customer Addresses]
 *     summary: Delete a customer address
 *     description: Deletes a customer address by its unique identifier (soft delete by default)
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
 *         name: hardDelete
 *         schema: { type: boolean, default: false }
 *         description: If true, performs hard delete (permanent). If false, performs soft delete.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: null, example: null }
 *                 message: { type: string, example: "Endereço do cliente excluído com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class DeleteCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteCustomerAddressUseCase = container.resolve(DeleteCustomerAddressUseCase)

    const result = await deleteCustomerAddressUseCase.execute(id)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}