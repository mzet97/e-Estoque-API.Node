import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCategoryUseCase from './GetCategoryUseCase'

export default class GetCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const getCategoryUseCase = container.resolve(GetCategoryUseCase)

    console.log('GetCategoryController.handle:', { id })
    
    const result = await getCategoryUseCase.execute(id)

    if (!result.success) {
      console.error('GetCategoryController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CATEGORY_NOT_FOUND', message: result.message }]
      })
      return
    }

    console.log('GetCategoryController.handle:', { id: result.data.id, name: result.data.name })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}