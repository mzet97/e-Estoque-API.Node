import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteProductUseCase from './DeleteProductUseCase'

export default class DeleteProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteProductUseCase = container.resolve(DeleteProductUseCase)

    console.log('DeleteProductController.handle:', { id })
    
    const result = await deleteProductUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteProductController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_PRODUCT_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteProductController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}