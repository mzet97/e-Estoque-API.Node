import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateStockUseCase from '../../useCases/updateStock/UpdateStockUseCase'
import { UpdateStockViewModel } from '../../useCases/updateStock/UpdateStockUseCase'

/**
 * @swagger
 * /inventory/{productId}/{companyId}/stock:
 *   put:
 *     tags: [Inventory]
 *     summary: Update stock
 *     description: Updates the stock quantity for a specific product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Company unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStockRequest'
 *           examples:
 *             add_stock:
 *               summary: Add stock
 *               value:
 *                 operation: "IN"
 *                 quantity: 100
 *                 reason: "Compra"
 *                 unitCost: 15.50
 *                 location: "Depósito A"
 *             remove_stock:
 *               summary: Remove stock
 *               value:
 *                 operation: "OUT"
 *                 quantity: 50
 *                 reason: "Venda"
 *                 referenceId: "123e4567-e89b-12d3-a456-426614174002"
 *                 referenceType: "sale"
 *                 location: "Depósito A"
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
 *                   $ref: '#/components/schemas/InventoryStock'
 *                 message: { type: string, example: "Estoque atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class UpdateStockController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const updateStockUseCase = container.resolve(UpdateStockUseCase)
      const { productId, companyId } = request.params
      const { 
        operation, 
        quantity, 
        userId, 
        reason, 
        referenceId, 
        referenceType, 
        unitCost, 
        unitPrice, 
        location, 
        notes 
      } = request.body

      const viewModel: UpdateStockViewModel = {
        productId,
        companyId,
        operation,
        quantity,
        userId,
        reason,
        referenceId,
        referenceType,
        unitCost,
        unitPrice,
        location,
        notes
      }

      const result = await updateStockUseCase.execute(viewModel)

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
      console.error('Error in UpdateStockController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}