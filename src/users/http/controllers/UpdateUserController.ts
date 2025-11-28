import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateUserUseCase from '../../useCases/updateUser/UpdateUserUseCase'
import UserViewModel from '../../viewModels/UserViewModel'

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user
 *     description: Updates an existing user with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: User unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           examples:
 *             update_name:
 *               summary: Update user name
 *               value:
 *                 name: "João da Silva Santos"
 *             update_phone:
 *               summary: Update phone number
 *               value:
 *                 phoneNumber: "(11) 98765-4321"
 *             update_email:
 *               summary: Update email
 *               value:
 *                 email: "joao.novo@empresa.com.br"
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
 *                 message: { type: string, example: "Usuário atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class UpdateUserController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as UserViewModel
    const updateUserUseCase = container.resolve(UpdateUserUseCase)

    console.log('UpdateUserController.handle:', { id })
    
    const result = await updateUserUseCase.execute(id, viewModel)

    if (!result.success) {
      console.error('UpdateUserController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_USER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = UserViewModel.fromUser(result.data)

    console.log('UpdateUserController.handle:', { 
      id: viewModelResult.id, 
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}