import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListInventoryStockUseCase from '../../useCases/listStock/ListInventoryStockUseCase'
import InventoryViewModel from '../../viewModels/InventoryViewModel'

/**
 * @swagger
 * /inventory/stock:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory stock
 *     description: Returns a paginated list of inventory stock with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *         description: Filter by product ID
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filter by company ID
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *         description: Filter by location
 *       - in: query
 *         name: warehouseZone
 *         schema: { type: string }
 *         description: Filter by warehouse zone
 *       - in: query
 *         name: abcClassification
 *         schema: { type: string, enum: [A, B, C] }
 *         description: Filter by ABC classification
 *       - in: query
 *         name: stockoutRiskLevel
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *         description: Filter by stockout risk level
 *       - in: query
 *         name: minTotalQuantity
 *         schema: { type: number }
 *         description: Minimum total quantity
 *       - in: query
 *         name: maxTotalQuantity
 *         schema: { type: number }
 *         description: Maximum total quantity
 *       - in: query
 *         name: minAvailableQuantity
 *         schema: { type: number }
 *         description: Minimum available quantity
 *       - in: query
 *         name: maxAvailableQuantity
 *         schema: { type: number }
 *         description: Maximum available quantity
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
 *         schema: { type: string, enum: [totalQuantity, availableQuantity, createdAt, updatedAt], default: totalQuantity }
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Order direction
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term
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
 *                 message: { type: string, example: "Estoque listado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListInventoryStockController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listInventoryStockUseCase = container.resolve(ListInventoryStockUseCase)

    // Extrair filtros da query string
    const filters = {
      productId: request.query.productId as string,
      companyId: request.query.companyId as string,
      location: request.query.location as string,
      warehouseZone: request.query.warehouseZone as string,
      abcClassification: request.query.abcClassification as any,
      stockoutRiskLevel: request.query.stockoutRiskLevel as any,
      minTotalQuantity: request.query.minTotalQuantity ? parseFloat(request.query.minTotalQuantity as string) : undefined,
      maxTotalQuantity: request.query.maxTotalQuantity ? parseFloat(request.query.maxTotalQuantity as string) : undefined,
      minAvailableQuantity: request.query.minAvailableQuantity ? parseFloat(request.query.minAvailableQuantity as string) : undefined,
      maxAvailableQuantity: request.query.maxAvailableQuantity ? parseFloat(request.query.maxAvailableQuantity as string) : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'totalQuantity',
      orderDirection: request.query.orderDirection as any || 'DESC',
      search: request.query.search as string
    }

    console.log('ListInventoryStockController.handle:', { filters })

    const result = await listInventoryStockUseCase.execute(filters)

    if (!result.success) {
      console.error('ListInventoryStockController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_INVENTORY_STOCK_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: InventoryViewModel.fromInventoryStockList(result.data)
    }

    console.log('ListInventoryStockController.handle:', {
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message
    })

    response.status(200).json(viewModelResult)
  }
}