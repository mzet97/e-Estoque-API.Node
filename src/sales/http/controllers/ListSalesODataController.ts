import { Request, Response } from 'express'
import { inject, injectable } from 'tsyringe'
import ListSalesODataUseCase from '../../useCases/listSalesOData/ListSalesODataUseCase'
import IController from '@shared/useCases/IController'

/**
 * @swagger
 * /sales/odata:
 *   get:
 *     tags: [Sales]
 *     summary: List all sales with OData support
 *     description: Returns a list of sales using OData query syntax for advanced filtering, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: $filter
 *         schema: { type: string }
 *         description: OData filter expression (e.g., "status eq 'CONFIRMED' and totalAmount gt 1000")
 *       - in: query
 *         name: $orderby
 *         schema: { type: string }
 *         description: OData orderby expression (e.g., "saleDate desc")
 *       - in: query
 *         name: $top
 *         schema: { type: number }
 *         description: Maximum number of records to return
 *       - in: query
 *         name: $skip
 *         schema: { type: number }
 *         description: Number of records to skip
 *       - in: query
 *         name: $select
 *         schema: { type: string }
 *         description: Fields to select (e.g., "id,saleNumber,totalAmount,status")
 *       - in: query
 *         name: $expand
 *         schema: { type: string }
 *         description: Related entities to expand (e.g., "customer,items")
 *       - in: query
 *         name: $count
 *         schema: { type: boolean }
 *         description: Include count of total records
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
 *                 message: { type: string, example: "Vendas listadas com sucesso com OData" }
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

@injectable()
export default class ListSalesODataController implements IController {
  constructor(
    @inject(ListSalesODataUseCase.name)
    private listSalesODataUseCase: ListSalesODataUseCase,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log('ListSalesODataController.handle:', req.query)

      const oDataQuery = req.oDataQuery
      const userId = (req as any).user?.id

      const result = await this.listSalesODataUseCase.execute({
        oDataQuery,
        userId,
        cacheEnabled: true,
        includeCount: oDataQuery?.count || false
      })

      if (!result.success) {
        return res.status(400).json(result)
      }

      // If $count was requested, return count directly
      if (oDataQuery?.count) {
        return res.json({
          '@odata.count': result.data?.total || 0
        })
      }

      return res.json(result)

    } catch (error) {
      console.error('Error in ListSalesODataController:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao listar vendas',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
