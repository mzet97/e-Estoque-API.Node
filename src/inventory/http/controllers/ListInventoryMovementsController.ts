import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListInventoryMovementsUseCase from '../../useCases/listMovements/ListInventoryMovementsUseCase'
import InventoryViewModel from '../../viewModels/InventoryViewModel'

/**
 * @swagger
 * /inventory/movements:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory movements
 *     description: Returns a paginated list of inventory movements with optional filtering
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
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Filter by user ID
 *       - in: query
 *         name: movementType
 *         schema: { type: string, enum: [IN, OUT, ADJUSTMENT, TRANSFER] }
 *         description: Filter by movement type
 *       - in: query
 *         name: movementReason
 *         schema: { type: string }
 *         description: Filter by movement reason
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, COMPLETED, CANCELLED] }
 *         description: Filter by status
 *       - in: query
 *         name: qualityStatus
 *         schema: { type: string, enum: [APPROVED, REJECTED, PENDING] }
 *         description: Filter by quality status
 *       - in: query
 *         name: referenceType
 *         schema: { type: string }
 *         description: Filter by reference type
 *       - in: query
 *         name: referenceId
 *         schema: { type: string, format: uuid }
 *         description: Filter by reference ID
 *       - in: query
 *         name: minQuantity
 *         schema: { type: number }
 *         description: Minimum quantity
 *       - in: query
 *         name: maxQuantity
 *         schema: { type: number }
 *         description: Maximum quantity
 *       - in: query
 *         name: minDate
 *         schema: { type: string, format: date }
 *         description: Start date filter
 *       - in: query
 *         name: maxDate
 *         schema: { type: string, format: date }
 *         description: End date filter
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *         description: Filter by location
 *       - in: query
 *         name: warehouseZone
 *         schema: { type: string }
 *         description: Filter by warehouse zone
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
 *         schema: { type: string, enum: [quantity, createdAt, updatedAt], default: createdAt }
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
 *                 message: { type: string, example: "Movimentações de estoque listadas com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListInventoryMovementsController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listInventoryMovementsUseCase = container.resolve(ListInventoryMovementsUseCase)

    // Extrair filtros da query string
    const filters = {
      productId: request.query.productId as string,
      companyId: request.query.companyId as string,
      userId: request.query.userId as string,
      movementType: request.query.movementType as any,
      movementReason: request.query.movementReason as any,
      status: request.query.status as any,
      qualityStatus: request.query.qualityStatus as any,
      referenceType: request.query.referenceType as string,
      referenceId: request.query.referenceId as string,
      minQuantity: request.query.minQuantity ? parseFloat(request.query.minQuantity as string) : undefined,
      maxQuantity: request.query.maxQuantity ? parseFloat(request.query.maxQuantity as string) : undefined,
      minDate: request.query.minDate ? new Date(request.query.minDate as string) : undefined,
      maxDate: request.query.maxDate ? new Date(request.query.maxDate as string) : undefined,
      location: request.query.location as string,
      warehouseZone: request.query.warehouseZone as string,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC',
      search: request.query.search as string
    }

    console.log('ListInventoryMovementsController.handle:', { filters })

    const result = await listInventoryMovementsUseCase.execute(filters)

    if (!result.success) {
      console.error('ListInventoryMovementsController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_INVENTORY_MOVEMENTS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: InventoryViewModel.fromInventoryMovementList(result.data)
    }

    console.log('ListInventoryMovementsController.handle:', {
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message
    })

    response.status(200).json(viewModelResult)
  }
}