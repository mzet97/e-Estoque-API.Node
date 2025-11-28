import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateSaleUseCase from './UpdateSaleUseCase'

export interface UpdateSaleViewModel {
  customerId?: string
  status?: string
  notes?: string
  shippingAddress?: string
  discount?: number
  tax?: number
}

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     tags: [Sales]
 *     summary: Update a sale
 *     description: Updates an existing sale with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Sale unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSaleRequest'
 *           examples:
 *             update_status:
 *               summary: Update status
 *               value:
 *                 status: "CONFIRMED"
 *             update_discount:
 *               summary: Update discount
 *               value:
 *                 discount: 50.00
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
 *                   $ref: '#/components/schemas/Sale'
 *                 message: { type: string, example: "Venda atualizada com sucesso" }
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
export default class UpdateSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const updateData = request.body
    const updateSaleUseCase = container.resolve(UpdateSaleUseCase)

    console.log('UpdateSaleController.handle:', { id, status: updateData.status })
    
    const result = await updateSaleUseCase.execute(id, updateData)

    if (!result.success) {
      console.error('UpdateSaleController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_SALE_ERROR', message: result.message }]
      })
      return
    }

    console.log('UpdateSaleController.handle:', { id: result.data.id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}