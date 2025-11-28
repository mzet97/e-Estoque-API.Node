import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCategoryUseCase from './CreateCategoryUseCase'

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     description: Creates a new category with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *           examples:
 *             category_eletronicos:
 *               summary: Example category
 *               value:
 *                 name: "Eletrônicos"
 *                 description: "Produtos eletrônicos e tecnológicos"
 *                 parentCategoryId: null
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
 *                   $ref: '#/components/schemas/Category'
 *                 message: { type: string, example: "Categoria criada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CreateCategoryController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCategoryUseCase = container.resolve(CreateCategoryUseCase)
    const viewModel = request.body

    console.log('CreateCategoryController.handle:', { name: viewModel.name })
    
    const result = await createCategoryUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCategoryController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CATEGORY_ERROR', message: result.message }]
      })
      return
    }

    console.log('CreateCategoryController.handle:', { id: result.data.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}
