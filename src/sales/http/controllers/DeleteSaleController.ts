import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteSaleUseCase from './DeleteSaleUseCase'

export default class DeleteSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteSaleUseCase = container.resolve(DeleteSaleUseCase)

    console.log('DeleteSaleController.handle:', { id })
    
    const result = await deleteSaleUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteSaleController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_SALE_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteSaleController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}