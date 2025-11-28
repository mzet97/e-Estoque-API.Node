import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetTaxUseCase from '../../useCases/getTax/GetTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

/**
 * @swagger
 * /taxes/{id}:
 *   get:
 *     tags: [Taxes]
 *     summary: Get tax by ID
 *     description: Returns a single tax by its unique identifier
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
 *         name: includeCategory
 *         schema: { type: boolean, default: true }
 *         description: Include tax category in response
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
 *                   $ref: '#/components/schemas/Tax'
 *                 message: { type: string, example: "Imposto encontrado" }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class GetTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCategory = request.query.includeCategory !== 'false'
    const getTaxUseCase = container.resolve(GetTaxUseCase)
    
    const result = await getTaxUseCase.execute(id)

    if (!result.success) {
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'TAX_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data, includeCategory)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}