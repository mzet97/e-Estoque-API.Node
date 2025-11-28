import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCategoryUseCase from './CreateCategoryUseCase'

export default class CreateCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCategoryUseCase = container.resolve(CreateCategoryUseCase)
    const viewModel = request.body

    console.log('CreateCategoryController.handle:', { name: viewModel.name })
    
    const result = await createCategoryUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCategoryController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CATEGORY_ERROR', message: result.message }]
      })
      return
    }

    console.log('CreateCategoryController.handle:', { id: result.data.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}
