import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteUserUseCase from '../../useCases/deleteUser/DeleteUserUseCase'

export default class DeleteUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteUserUseCase = container.resolve(DeleteUserUseCase)

    console.log('DeleteUserController.handle:', { id })
    
    const result = await deleteUserUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteUserController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_USER_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteUserController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}