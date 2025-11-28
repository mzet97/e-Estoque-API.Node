import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetUserUseCase from '../../useCases/getUser/GetUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

export default class GetUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeRole = request.query.includeRole !== 'false'
    const getUserUseCase = container.resolve(GetUserUseCase)

    console.log('GetUserController.handle:', { id, includeRole })
    
    const result = await getUserUseCase.execute(id, includeRole)

    if (!result.success) {
      console.error('GetUserController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'USER_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data, includeRole)

    console.log('GetUserController.handle:', { 
      id: viewModelResult.id, 
      name: viewModelResult.name,
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}