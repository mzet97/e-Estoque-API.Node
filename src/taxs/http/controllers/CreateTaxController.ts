import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CreateTaxUseCase from '../../useCases/createTax/CreateTaxUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

/**
 * @swagger
 * /taxes:
 *   post:
 *     tags: [Taxes]
 *     summary: Create a new tax
 *     description: Creates a new tax in the system with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaxRequest'
 *           examples:
 *             create_icms:
 *               summary: Create ICMS tax
 *               value:
 *                 name: "ICMS"
 *                 percentage: 18
 *                 idCategory: "123e4567-e89b-12d3-a456-426614174000"
 *                 description: "Imposto sobre Circulação de Mercadorias"
 *             create_ipi:
 *               summary: Create IPI tax
 *               value:
 *                 name: "IPI"
 *                 percentage: 5
 *                 idCategory: "123e4567-e89b-12d3-a456-426614174001"
 *                 description: "Imposto sobre Produtos Industrializados"
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
 *                   $ref: '#/components/schemas/Tax'
 *                 message: { type: string, example: "Imposto criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class CreateTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createTaxUseCase = container.resolve(CreateTaxUseCase)
    const viewModel = request.body as TaxViewModel

    const result = await createTaxUseCase.execute(viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_TAX_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = TaxViewModel.fromTax(result.data)
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}