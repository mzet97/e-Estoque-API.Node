import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateUserUseCase from '../../useCases/createUser/CreateUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

export default class CreateUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createUserUseCase = container.resolve(CreateUserUseCase)
    const viewModel = request.body as UserViewModel

    console.log('CreateUserController.handle:', { 
      name: viewModel.name, 
      email: viewModel.email,
      firstName: viewModel.firstName,
      roleId: viewModel.roleId
    })
    
    const result = await createUserUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateUserController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_USER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data)

    console.log('CreateUserController.handle:', { 
      id: viewModelResult.id, 
      message: result.message 
    })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}