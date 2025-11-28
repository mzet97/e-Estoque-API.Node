import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateUserUseCase from '../../useCases/createUser/CreateUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Creates a new user in the system with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           examples:
 *             create_admin:
 *               summary: Create admin user
 *               value:
 *                 name: "João da Silva"
 *                 firstName: "João"
 *                 lastName: "Silva"
 *                 email: "joao.silva@empresa.com.br"
 *                 phoneNumber: "(11) 99999-9999"
 *                 roleId: "123e4567-e89b-12d3-a456-426614174000"
 *             create_manager:
 *               summary: Create manager user
 *               value:
 *                 name: "Maria Santos"
 *                 firstName: "Maria"
 *                 lastName: "Santos"
 *                 email: "maria.santos@empresa.com.br"
 *                 phoneNumber: "(11) 88888-8888"
 *                 roleId: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message: { type: string, example: "Usuário criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class CreateUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createUserUseCase = container.resolve(CreateUserUseCase)
    const viewModel = request.body as UserViewModel

    console.log('CreateUserController.handle:', { 
      name: viewModel.name, 
      email: viewModel.email,
      firstName: viewModel.firstName,
      roleId: viewModel.roleId
    })
    
    const result = await createUserUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateUserController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_USER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data)

    console.log('CreateUserController.handle:', { 
      id: viewModelResult.id, 
      message: result.message 
    })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}