import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import DeleteTaxUseCase from '../../useCases/deleteTax/DeleteTaxUseCase'

/**
 * @swagger
 * /taxes/{id}:
 *   delete:
 *     tags: [Taxes]
 *     summary: Delete a tax
 *     description: Deletes a tax by its unique identifier (soft delete by default)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Tax unique identifier
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
 *                 message: { type: string, example: "Imposto excluído com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class DeleteTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteTaxUseCase = container.resolve(DeleteTaxUseCase)

    const result = await deleteTaxUseCase.execute(id)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_TAX_ERROR', message: result.message }]
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