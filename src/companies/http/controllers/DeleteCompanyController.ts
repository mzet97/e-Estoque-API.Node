import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import DeleteCompanyUseCase from './DeleteCompanyUseCase'

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete a company
 *     description: Deletes a company by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Company unique identifier
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
 *                 data: { type: null, example: null }
 *                 message: { type: string, example: "Empresa excluída com sucesso" }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class DeleteCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const deleteCompanyUseCase = container.resolve(DeleteCompanyUseCase)
    const { id } = request.params

    console.log('DeleteCompanyController.handle:', { id })
    
    const result = await deleteCompanyUseCase.execute(id)

    if (!result.success) {
      console.error('DeleteCompanyController.handle:', { message: result.message })
      
      const statusCode = result.message.includes('não encontrada') ? 404 : 400
      
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    console.log('DeleteCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}
