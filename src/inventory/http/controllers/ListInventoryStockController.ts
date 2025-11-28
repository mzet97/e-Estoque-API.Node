import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListInventoryStockUseCase from '../../useCases/listStock/ListInventoryStockUseCase'
import InventoryViewModel from '../../viewModels/InventoryViewModel'

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