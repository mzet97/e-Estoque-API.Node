import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ProcessPaymentUseCase from '../../useCases/processPayment/ProcessPaymentUseCase'
import { ProcessPaymentViewModel } from '../../useCases/processPayment/ProcessPaymentUseCase'

export default class ProcessPaymentController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const processPaymentUseCase = container.resolve(ProcessPaymentUseCase)
      const { id } = request.params
      const { paymentDate, transactionId, paymentNotes } = request.body

      const viewModel: ProcessPaymentViewModel = {
        saleId: id,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        transactionId,
        paymentNotes
      }

      const result = await processPaymentUseCase.execute(viewModel)

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
      console.error('Error in ProcessPaymentController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}