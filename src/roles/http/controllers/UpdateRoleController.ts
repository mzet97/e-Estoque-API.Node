import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateRoleUseCase from './UpdateRoleUseCase'


export default class UpdateRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const updateRoleUseCase = container.resolve(UpdateRoleUseCase)
    const { id, name } = request.body

    request.log.info('UpdateRoleController.handle: %o', { id, name })
    const role = await updateRoleUseCase.execute({ id, name })

    if(!role.success) {
      request.log.error('UpdateRoleController.handle: %o', { message: role.message })
      response.status(400).json({ message: role.message })
      return;
    }

    response.status(201).json(role)
  }

}
