import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateUserUseCase from '../../useCases/updateUser/UpdateUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

export default class UpdateUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as UserViewModel
    const updateUserUseCase = container.resolve(UpdateUserUseCase)

    console.log('UpdateUserController.handle:', { id })
    
    const result = await updateUserUseCase.execute(id, viewModel)

    if (!result.success) {
      console.error('UpdateUserController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_USER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data)

    console.log('UpdateUserController.handle:', { 
      id: viewModelResult.id, 
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}