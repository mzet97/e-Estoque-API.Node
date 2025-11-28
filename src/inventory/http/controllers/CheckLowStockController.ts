import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CheckLowStockUseCase from '../../useCases/checkLowStock/CheckLowStockUseCase'
import { CheckLowStockViewModel } from '../../useCases/checkLowStock/CheckLowStockUseCase'

/**
 * @swagger
 * /inventory/{companyId}/low-stock-check:
 *   get:
 *     tags: [Inventory]
 *     summary: Check low stock items
 *     description: Returns items with low stock levels based on various criteria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Company unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: includeCritical
 *         schema: { type: boolean, default: true }
 *         description: Include critical stock items
 *       - in: query
 *         name: includeOutOfStock
 *         schema: { type: boolean, default: true }
 *         description: Include out of stock items
 *       - in: query
 *         name: includeNearExpiry
 *         schema: { type: boolean, default: true }
 *         description: Include items near expiry
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *         description: Filter by location
 *       - in: query
 *         name: warehouseZone
 *         schema: { type: string }
 *         description: Filter by warehouse zone
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LowStockItem'
 *                 message: { type: string, example: "Verificação de estoque baixo realizada" }
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

export default class CheckLowStockController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const checkLowStockUseCase = container.resolve(CheckLowStockUseCase)
      const { companyId } = request.params
      const { 
        includeCritical, 
        includeOutOfStock, 
        includeNearExpiry, 
        location, 
        warehouseZone 
      } = request.query

      const viewModel: CheckLowStockViewModel = {
        companyId,
        includeCritical: includeCritical === 'true',
        includeOutOfStock: includeOutOfStock === 'true',
        includeNearExpiry: includeNearExpiry === 'true',
        location: location as string,
        warehouseZone: warehouseZone as string
      }

      const result = await checkLowStockUseCase.execute(viewModel)

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
      console.error('Error in CheckLowStockController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}