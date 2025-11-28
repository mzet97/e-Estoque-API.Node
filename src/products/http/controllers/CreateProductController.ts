import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateProductUseCase from './CreateProductUseCase'

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     description: Creates a new product with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *           examples:
 *             produto_eletronico:
 *               summary: Example product
 *               value:
 *                 name: "Smartphone Samsung Galaxy"
 *                 description: "Smartphone com 128GB de armazenamento"
 *                 sku: "SMG-128-BLK"
 *                 barCode: "7891234567890"
 *                 price: 1299.99
 *                 costPrice: 999.99
 *                 categoryId: "550e8400-e29b-41d4-a716-446655440000"
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
 *                   $ref: '#/components/schemas/Product'
 *                 message: { type: string, example: "Produto criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CreateProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createProductUseCase = container.resolve(CreateProductUseCase)
    const viewModel = request.body

    console.log('CreateProductController.handle:', { name: viewModel.name, price: viewModel.price })
    
    const result = await createProductUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateProductController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_PRODUCT_ERROR', message: result.message }]
      })
      return
    }

    console.log('CreateProductController.handle:', { id: result.data.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}
