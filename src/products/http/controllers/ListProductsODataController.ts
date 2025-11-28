import { Request, Response } from 'express'
import { inject, injectable } from 'tsyringe'
import ListProductsODataUseCase from '../../useCases/listProductsOData/ListProductsODataUseCase'
import IController from '@shared/useCases/IController'

/**
 * @swagger
 * /products/odata:
 *   get:
 *     tags: [Products]
 *     summary: List all products with OData support
 *     description: Returns a list of products using OData query syntax for advanced filtering, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: $filter
 *         schema: { type: string }
 *         description: OData filter expression (e.g., "name eq 'Smartphone' and price gt 1000")
 *       - in: query
 *         name: $orderby
 *         schema: { type: string }
 *         description: OData orderby expression (e.g., "price desc")
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
 *         description: Fields to select (e.g., "id,name,price,sku")
 *       - in: query
 *         name: $expand
 *         schema: { type: string }
 *         description: Related entities to expand (e.g., "category")
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
 *                 message: { type: string, example: "Produtos listados com sucesso com OData" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

@injectable()
export default class ListProductsODataController implements IController {
  constructor(
    @inject(ListProductsODataUseCase.name)
    private listProductsODataUseCase: ListProductsODataUseCase,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log('ListProductsODataController.handle:', req.query)

      const oDataQuery = req.oDataQuery
      const userId = (req as any).user?.id

      const result = await this.listProductsODataUseCase.execute({
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
      console.error('Error in ListProductsODataController:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao listar produtos',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
