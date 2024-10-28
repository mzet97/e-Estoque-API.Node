import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListRolesUseCase from './ListRolesUseCase'

export default class ListRolesController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const listRolesUseCase = container.resolve(ListRolesUseCase)

    const page =
      request.query.page && Number(request.query.page) > 0
        ? Number(request.query.page)
        : 1

    const pageSize =
      request.query.limit && Number(request.query.limit) > 0
        ? Number(request.query.limit)
        : 15

    request.log.info('ListRolesController.handle: %o', { page, pageSize })
    const roles = await listRolesUseCase.execute({ page, pageSize })

    response.json(roles)
  }

}
