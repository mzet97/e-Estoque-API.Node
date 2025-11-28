import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateProductUseCase from './CreateProductUseCase'

export default class CreateProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createProductUseCase = container.resolve(CreateProductUseCase)
    const viewModel = request.body

    console.log('CreateProductController.handle:', { name: viewModel.name, price: viewModel.price })
    
    const result = await createProductUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateProductController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_PRODUCT_ERROR', message: result.message }]
      })
      return
    }

    console.log('CreateProductController.handle:', { id: result.data.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}
