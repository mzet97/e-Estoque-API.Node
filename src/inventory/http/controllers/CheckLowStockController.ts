import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CheckLowStockUseCase from '../../useCases/checkLowStock/CheckLowStockUseCase'
import { CheckLowStockViewModel } from '../../useCases/checkLowStock/CheckLowStockUseCase'

export default class CheckLowStockController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const checkLowStockUseCase = container.resolve(CheckLowStockUseCase)
      const { companyId } = request.params
      const { 
        includeCritical, 
        includeOutOfStock, 
        includeNearExpiry, 
        location, 
        warehouseZone 
      } = request.query

      const viewModel: CheckLowStockViewModel = {
        companyId,
        includeCritical: includeCritical === 'true',
        includeOutOfStock: includeOutOfStock === 'true',
        includeNearExpiry: includeNearExpiry === 'true',
        location: location as string,
        warehouseZone: warehouseZone as string
      }

      const result = await checkLowStockUseCase.execute(viewModel)

      if (!result.success) {
        response.status(400).json({
          success: false,
          data: null,
          message: result.message
        })
        return
      }

      response.json({
        success: true,
        data: result.data,
        message: result.message
      })
    } catch (error) {
      console.error('Error in CheckLowStockController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}