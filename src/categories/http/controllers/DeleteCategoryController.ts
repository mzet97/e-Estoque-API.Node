import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCategoryUseCase from './DeleteCategoryUseCase'

export default class DeleteCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteCategoryUseCase = container.resolve(DeleteCategoryUseCase)

    console.log('DeleteCategoryController.handle:', { id })
    
    const result = await deleteCategoryUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteCategoryController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_CATEGORY_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCategoryController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}