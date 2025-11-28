import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListRolesUseCase from './ListRolesUseCase'

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles
 *     description: Returns a paginated list of roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: number, minimum: 1, default: 15 }
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PagedResult'
 *                 message: { type: string, example: "Perfis listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

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
