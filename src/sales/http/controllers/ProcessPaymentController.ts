import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ProcessPaymentUseCase from '../../useCases/processPayment/ProcessPaymentUseCase'
import { ProcessPaymentViewModel } from '../../useCases/processPayment/ProcessPaymentUseCase'

/**
 * @swagger
 * /sales/{id}/payment:
 *   post:
 *     tags: [Sales]
 *     summary: Process payment for a sale
 *     description: Processes payment for an existing sale
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
 *             $ref: '#/components/schemas/ProcessPaymentRequest'
 *           examples:
 *             credit_card_payment:
 *               summary: Credit card payment
 *               value:
 *                 paymentDate: "2025-11-28T10:00:00.000Z"
 *                 transactionId: "TXN-12345-ABC"
 *                 paymentNotes: "Pagamento processado com sucesso"
 *             cash_payment:
 *               summary: Cash payment
 *               value:
 *                 paymentDate: "2025-11-28T10:00:00.000Z"
 *                 transactionId: "CASH-001"
 *                 paymentNotes: "Pagamento em dinheiro"
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
 *                 message: { type: string, example: "Pagamento processado com sucesso" }
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
export default class ProcessPaymentController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const processPaymentUseCase = container.resolve(ProcessPaymentUseCase)
      const { id } = request.params
      const { paymentDate, transactionId, paymentNotes } = request.body

      const viewModel: ProcessPaymentViewModel = {
        saleId: id,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        transactionId,
        paymentNotes
      }

      const result = await processPaymentUseCase.execute(viewModel)

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
      console.error('Error in ProcessPaymentController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}