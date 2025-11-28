import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListUsersUseCase from '../../useCases/listUsers/ListUsersUseCase'
import { UserFilters } from '../../repositories/IUsersRepository'
import UserViewModel from '../../viewModels/UserViewModel'

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     description: Returns a paginated list of users with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by user name
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *         description: Filter by email
 *       - in: query
 *         name: firstName
 *         schema: { type: string }
 *         description: Filter by first name
 *       - in: query
 *         name: lastName
 *         schema: { type: string }
 *         description: Filter by last name
 *       - in: query
 *         name: phoneNumber
 *         schema: { type: string }
 *         description: Filter by phone number
 *       - in: query
 *         name: roleId
 *         schema: { type: string, format: uuid }
 *         description: Filter by role ID
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: isVerified
 *         schema: { type: boolean }
 *         description: Filter by verification status
 *       - in: query
 *         name: hasAvatar
 *         schema: { type: boolean }
 *         description: Filter by whether user has avatar
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 20 }
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [name, email, firstName, lastName, createdAt, updatedAt], default: createdAt }
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Order direction
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
 *                 message: { type: string, example: "Usuários listados com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class ListUsersController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listUsersUseCase = container.resolve(ListUsersUseCase)
    
    // Extrair filtros da query string
    const filters: UserFilters = {
      name: request.query.name as string,
      email: request.query.email as string,
      firstName: request.query.firstName as string,
      lastName: request.query.lastName as string,
      phoneNumber: request.query.phoneNumber as string,
      roleId: request.query.roleId as string,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      isVerified: request.query.isVerified ? request.query.isVerified === 'true' : undefined,
      hasAvatar: request.query.hasAvatar ? request.query.hasAvatar === 'true' : undefined,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListUsersController.handle:', { filters })
    
    const result = await listUsersUseCase.execute(filters)

    if (!result.success) {
      console.error('ListUsersController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_USERS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: UserViewModel.fromUserList(result.data)
    }

    console.log('ListUsersController.handle:', { 
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message 
    })
    
    response.status(200).json(viewModelResult)
  }
}