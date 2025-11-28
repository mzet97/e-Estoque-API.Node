import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListInventoryMovementsUseCase from '../../useCases/listMovements/ListInventoryMovementsUseCase'
import InventoryViewModel from '../../viewModels/InventoryViewModel'

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