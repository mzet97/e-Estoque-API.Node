import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateProductUseCase from './UpdateProductUseCase'
import { CreateProductViewModel } from './CreateProductUseCase'

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     description: Updates an existing product with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Product unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *           examples:
 *             update_price:
 *               summary: Update price
 *               value:
 *                 price: 1399.99
 *             update_status:
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
 *                   $ref: '#/components/schemas/Product'
 *                 message: { type: string, example: "Produto atualizado com sucesso" }
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
export default class UpdateProductController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateProductUseCase = container.resolve(UpdateProductUseCase)

    console.log('UpdateProductController.handle:', { id, name: updateData.name })
    
    const result = await updateProductUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateProductController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_PRODUCT_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateProductController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}