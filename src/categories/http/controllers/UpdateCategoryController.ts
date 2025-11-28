import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCategoryUseCase from './UpdateCategoryUseCase'

export interface UpdateCategoryViewModel {
  name?: string
  description?: string
  parentId?: string
  slug?: string
  isActive?: boolean
  sortOrder?: number
}

export default class UpdateCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateCategoryUseCase = container.resolve(UpdateCategoryUseCase)

    console.log('UpdateCategoryController.handle:', { id, name: updateData.name })
    
    const result = await updateCategoryUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateCategoryController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CATEGORY_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateCategoryController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}