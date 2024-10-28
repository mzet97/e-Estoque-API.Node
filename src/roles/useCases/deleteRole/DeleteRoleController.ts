import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteRoleUseCase from './DeleteRoleUseCase'

export default class DeleteRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const deleteRoleUseCase = container.resolve(DeleteRoleUseCase)
    const { id } = request.params

    request.log.info('DeleteRoleController.handle: %o', { id })
    const role = await deleteRoleUseCase.execute({ id })

    response.status(201).json(role)
  }

}
