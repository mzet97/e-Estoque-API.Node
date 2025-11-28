import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateRoleUseCase from './UpdateRoleUseCase'

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a role
 *     description: Updates an existing role with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Role unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Super Administrador"
 *           examples:
 *             update_name:
 *               summary: Update role name
 *               value:
 *                 name: "Super Administrador"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Perfil atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

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
