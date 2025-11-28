import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateTaxUseCase from '../../useCases/updateTax/UpdateTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

/**
 * @swagger
 * /taxes/{id}:
 *   put:
 *     tags: [Taxes]
 *     summary: Update a tax
 *     description: Updates an existing tax with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Tax unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaxRequest'
 *           examples:
 *             update_name:
 *               summary: Update tax name
 *               value:
 *                 name: "ICMS-SP"
 *             update_percentage:
 *               summary: Update tax percentage
 *               value:
 *                 percentage: 20
 *             update_description:
 *               summary: Update description
 *               value:
 *                 description: "ICMS para o estado de São Paulo"
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
 *                 message: { type: string, example: "Imposto atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class UpdateTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as TaxViewModel
    const updateTaxUseCase = container.resolve(UpdateTaxUseCase)

    const result = await updateTaxUseCase.execute(id, viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_TAX_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}