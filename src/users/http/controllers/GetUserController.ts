import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetUserUseCase from '../../useCases/getUser/GetUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Returns a single user by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: User unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: includeRole
 *         schema: { type: boolean, default: true }
 *         description: Include user role in response
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
 *                   $ref: '#/components/schemas/User'
 *                 message: { type: string, example: "Usuário encontrado" }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class GetUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeRole = request.query.includeRole !== 'false'
    const getUserUseCase = container.resolve(GetUserUseCase)

    console.log('GetUserController.handle:', { id, includeRole })
    
    const result = await getUserUseCase.execute(id, includeRole)

    if (!result.success) {
      console.error('GetUserController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'USER_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data, includeRole)

    console.log('GetUserController.handle:', { 
      id: viewModelResult.id, 
      name: viewModelResult.name,
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}