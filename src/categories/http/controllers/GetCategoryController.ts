import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCategoryUseCase from './GetCategoryUseCase'

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     description: Returns a single category by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Category unique identifier
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
 *                   $ref: '#/components/schemas/Category'
 *                 message: { type: string, example: "Categoria encontrada" }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class GetCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const getCategoryUseCase = container.resolve(GetCategoryUseCase)

    console.log('GetCategoryController.handle:', { id })
    
    const result = await getCategoryUseCase.execute(id)

    if (!result.success) {
      console.error('GetCategoryController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CATEGORY_NOT_FOUND', message: result.message }]
      })
      return
    }

    console.log('GetCategoryController.handle:', { id: result.data.id, name: result.data.name })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}