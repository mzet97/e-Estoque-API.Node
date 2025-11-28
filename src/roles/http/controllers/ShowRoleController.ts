import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ShowRoleUseCase from './ShowRoleUseCase'

export default class ShowRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const showRoleUseCase = container.resolve(ShowRoleUseCase)
    const { id } = request.params

    request.log.info('ShowRoleController.handle: %o', { id })
    const role = await showRoleUseCase.execute({ id })

    response.status(201).json(role)
  }

}
