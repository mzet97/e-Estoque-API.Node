import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteRoleUseCase from './DeleteRoleUseCase'

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     description: Deletes a role by its unique identifier
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
 *                 message: { type: string, example: "Perfil excluído com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class DeleteRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const deleteRoleUseCase = container.resolve(DeleteRoleUseCase)
    const { id } = request.params

    request.log.info('DeleteRoleController.handle: %o', { id })
    const role = await deleteRoleUseCase.execute({ id })

    response.status(201).json(role)
  }

}
