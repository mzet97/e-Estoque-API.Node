import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ShowRoleUseCase from './ShowRoleUseCase'

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     description: Returns a single role by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Role unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
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
 *                   $ref: '#/components/schemas/Role'
 *                 message: { type: string, example: "Perfil encontrado" }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ShowRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const showRoleUseCase = container.resolve(ShowRoleUseCase)
    const { id } = request.params

    request.log.info('ShowRoleController.handle: %o', { id })
    const role = await showRoleUseCase.execute({ id })

    response.status(201).json(role)
  }

}
