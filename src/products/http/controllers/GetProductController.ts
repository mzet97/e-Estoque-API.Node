import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetProductUseCase from './GetProductUseCase'

export default class GetProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const getProductUseCase = container.resolve(GetProductUseCase)

    console.log('GetProductController.handle:', { id })
    
    const result = await getProductUseCase.execute(id)

    if (!result.success) {
      console.error('GetProductController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'PRODUCT_NOT_FOUND', message: result.message }]
      })
      return
    }

    console.log('GetProductController.handle:', { id: result.data.id, name: result.data.name })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}