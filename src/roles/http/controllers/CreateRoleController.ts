import { Request, Response } from 'express';
import { container } from 'tsyringe';

import IController from '@shared/useCases/IController';
import CreateRoleUseCase from './CreateRoleUseCase';

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

