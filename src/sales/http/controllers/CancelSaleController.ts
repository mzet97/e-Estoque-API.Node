import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CancelSaleUseCase from '../../useCases/cancelSale/CancelSaleUseCase'
import { CancelSaleViewModel } from '../../useCases/cancelSale/CancelSaleUseCase'

export default class CancelSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const cancelSaleUseCase = container.resolve(CancelSaleUseCase)
      const { id } = request.params
      const { cancellationReason, refundAmount, refundDate, cancellationNotes } = request.body

      const viewModel: CancelSaleViewModel = {
        saleId: id,
        cancellationReason,
        refundAmount,
        refundDate: refundDate ? new Date(refundDate) : undefined,
        cancellationNotes
      }

      const result = await cancelSaleUseCase.execute(viewModel)

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
      console.error('Error in CancelSaleController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}