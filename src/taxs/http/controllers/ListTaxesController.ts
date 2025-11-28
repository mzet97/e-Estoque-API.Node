import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListTaxesUseCase from '../../useCases/listTaxes/ListTaxesUseCase'
import TaxViewModel from '../../viewModels/TaxViewModel'

/**
 * @swagger
 * /taxes:
 *   get:
 *     tags: [Taxes]
 *     summary: List all taxes
 *     description: Returns a paginated list of taxes with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by tax name
 *       - in: query
 *         name: idCategory
 *         schema: { type: string, format: uuid }
 *         description: Filter by category ID
 *       - in: query
 *         name: percentage
 *         schema: { type: number }
 *         description: Filter by percentage
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 20 }
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [name, percentage, createdAt, updatedAt], default: createdAt }
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Order direction
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
 *                   $ref: '#/components/schemas/PagedResult'
 *                 message: { type: string, example: "Impostos listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListTaxesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listTaxesUseCase = container.resolve(ListTaxesUseCase)
    
    const filters = {
      name: request.query.name as string,
      idCategory: request.query.idCategory as string,
      percentage: request.query.percentage ? parseFloat(request.query.percentage as string) : undefined,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }
    
    const result = await listTaxesUseCase.execute(filters)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_TAXES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: TaxViewModel.fromTaxList(result.data)
    }
    
    response.status(200).json(viewModelResult)
  }
}