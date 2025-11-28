import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateProductUseCase from './UpdateProductUseCase'
import { CreateProductViewModel } from './CreateProductUseCase'

export default class UpdateProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateProductUseCase = container.resolve(UpdateProductUseCase)

    console.log('UpdateProductController.handle:', { id, name: updateData.name })
    
    const result = await updateProductUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateProductController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_PRODUCT_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateProductController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}