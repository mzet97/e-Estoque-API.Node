import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCategoryUseCase from './UpdateCategoryUseCase'

export interface UpdateCategoryViewModel {
  name?: string
  description?: string
  parentId?: string
  slug?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     description: Updates an existing category with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Category unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *           examples:
 *             update_name:
 *               summary: Update name
 *               value:
 *                 name: "Eletrônicos e Tecnologia"
 *             update_active:
 *               summary: Update status
 *               value:
 *                 isActive: false
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
 *                 message: { type: string, example: "Categoria atualizada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class UpdateCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateCategoryUseCase = container.resolve(UpdateCategoryUseCase)

    console.log('UpdateCategoryController.handle:', { id, name: updateData.name })
    
    const result = await updateCategoryUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateCategoryController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CATEGORY_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateCategoryController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}