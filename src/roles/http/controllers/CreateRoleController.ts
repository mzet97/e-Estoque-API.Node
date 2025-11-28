import { Request, Response } from 'express';
import { container } from 'tsyringe';

import IController from '@shared/useCases/IController';
import CreateRoleUseCase from './CreateRoleUseCase';

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     description: Creates a new role in the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Administrador"
 *           examples:
 *             create_admin:
 *               summary: Create admin role
 *               value:
 *                 name: "Administrador"
 *             create_manager:
 *               summary: Create manager role
 *               value:
 *                 name: "Gerente"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Perfil criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class CreateRoleController implements IController {

  async handle(request: Request, response: Response): Promise<void> {
    const createRoleUseCase = container.resolve(CreateRoleUseCase);
    const { name } = request.body;

    request.log.info('CreateRoleController.handle: %o', { name });
    const role = await createRoleUseCase.execute({ name });

    if (!role.success) {
      request.log.error('CreateRoleController.handle: %o', { message: role.message });
      response.status(400).json({ message: role.message });
      return;
    }

    response.status(201).json(role);
  }

}

