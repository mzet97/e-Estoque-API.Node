import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CancelSaleUseCase from '../../useCases/cancelSale/CancelSaleUseCase'
import { CancelSaleViewModel } from '../../useCases/cancelSale/CancelSaleUseCase'

/**
 * @swagger
 * /sales/{id}/cancel:
 *   post:
 *     tags: [Sales]
 *     summary: Cancel a sale
 *     description: Cancels an existing sale with optional refund information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Sale unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelSaleRequest'
 *           examples:
 *             cancel_with_refund:
 *               summary: Cancel with refund
 *               value:
 *                 cancellationReason: "CLIENT_REQUEST"
 *                 refundAmount: 199.98
 *                 refundDate: "2025-11-28T10:00:00.000Z"
 *                 cancellationNotes: "Cliente solicitou cancelamento"
 *             cancel_no_refund:
 *               summary: Cancel without refund
 *               value:
 *                 cancellationReason: "PRODUCT_UNAVAILABLE"
 *                 cancellationNotes: "Produto em falta no estoque"
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
 *                   $ref: '#/components/schemas/Sale'
 *                 message: { type: string, example: "Venda cancelada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CancelSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const cancelSaleUseCase = container.resolve(CancelSaleUseCase)
      const { id } = request.params
      const { cancellationReason, refundAmount, refundDate, cancellationNotes } = request.body

      const viewModel: CancelSaleViewModel = {
        saleId: id,
        cancellationReason,
        refundAmount,
        refundDate: refundDate ? new Date(refundDate) : undefined,
        cancellationNotes
      }

      const result = await cancelSaleUseCase.execute(viewModel)

      if (!result.success) {
        response.status(400).json({
          success: false,
          data: null,
          message: result.message
        })
        return
      }

      response.json({
        success: true,
        data: result.data,
        message: result.message
      })
    } catch (error) {
      console.error('Error in CancelSaleController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}