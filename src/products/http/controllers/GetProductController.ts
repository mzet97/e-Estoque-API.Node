import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetProductUseCase from './GetProductUseCase'

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     description: Returns a single product by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Product unique identifier
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
 *                   $ref: '#/components/schemas/Product'
 *                 message: { type: string, example: "Produto encontrado" }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class GetProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const getProductUseCase = container.resolve(GetProductUseCase)

    console.log('GetProductController.handle:', { id })
    
    const result = await getProductUseCase.execute(id)

    if (!result.success) {
      console.error('GetProductController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'PRODUCT_NOT_FOUND', message: result.message }]
      })
      return
    }

    console.log('GetProductController.handle:', { id: result.data.id, name: result.data.name })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}