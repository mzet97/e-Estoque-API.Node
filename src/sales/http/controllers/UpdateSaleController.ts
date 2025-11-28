import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateSaleUseCase from './UpdateSaleUseCase'

export interface UpdateSaleViewModel {
  customerId?: string
  status?: string
  notes?: string
  shippingAddress?: string
  discount?: number
  tax?: number
}

export default class UpdateSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateSaleUseCase = container.resolve(UpdateSaleUseCase)

    console.log('UpdateSaleController.handle:', { id, status: updateData.status })
    
    const result = await updateSaleUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateSaleController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_SALE_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateSaleController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}