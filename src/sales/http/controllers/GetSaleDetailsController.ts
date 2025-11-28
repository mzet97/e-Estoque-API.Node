import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetSaleDetailsUseCase from '../../useCases/getSaleDetails/GetSaleDetailsUseCase'
import { GetSaleDetailsViewModel } from '../../useCases/getSaleDetails/GetSaleDetailsUseCase'

/**
 * @swagger
 * /sales/{id}/details:
 *   get:
 *     tags: [Sales]
 *     summary: Get sale details
 *     description: Returns detailed information about a specific sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Sale unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
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
 *                 message: { type: string, example: "Detalhes da venda encontrados" }
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
export default class GetSaleDetailsController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const getSaleDetailsUseCase = container.resolve(GetSaleDetailsUseCase)
      const { id } = request.params

      const viewModel: GetSaleDetailsViewModel = {
        saleId: id
      }

      const result = await getSaleDetailsUseCase.execute(viewModel)

      if (!result.success) {
        response.status(404).json({
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
      console.error('Error in GetSaleDetailsController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}