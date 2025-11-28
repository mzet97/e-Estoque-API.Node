import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateStockUseCase from '../../useCases/updateStock/UpdateStockUseCase'
import { UpdateStockViewModel } from '../../useCases/updateStock/UpdateStockUseCase'

export default class UpdateStockController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const updateStockUseCase = container.resolve(UpdateStockUseCase)
      const { productId, companyId } = request.params
      const { 
        operation, 
        quantity, 
        userId, 
        reason, 
        referenceId, 
        referenceType, 
        unitCost, 
        unitPrice, 
        location, 
        notes 
      } = request.body

      const viewModel: UpdateStockViewModel = {
        productId,
        companyId,
        operation,
        quantity,
        userId,
        reason,
        referenceId,
        referenceType,
        unitCost,
        unitPrice,
        location,
        notes
      }

      const result = await updateStockUseCase.execute(viewModel)

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
      console.error('Error in UpdateStockController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}