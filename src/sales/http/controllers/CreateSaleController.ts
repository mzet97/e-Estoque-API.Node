import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CreateSaleUseCase from '../../useCases/createSale/CreateSaleUseCase'

/**
 * @swagger
 * /sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a new sale
 *     description: Creates a new sale with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSaleRequest'
 *           examples:
 *             venda_simples:
 *               summary: Simple sale example
 *               value:
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 items:
 *                   - productId: "660e8400-e29b-41d4-a716-446655440001"
 *                     quantity: 2
 *                     unitPrice: 99.99
 *                 totalAmount: 199.98
 *                 paymentMethod: "CREDIT_CARD"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 message: { type: string, example: "Venda criada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CreateSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createSaleUseCase = container.resolve(CreateSaleUseCase)
    
    const result = await createSaleUseCase.execute(request.body)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message
      })
      return
    }

    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}