import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCompanyUseCase from './GetCompanyUseCase'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company by ID
 *     description: Returns a single company by its unique identifier
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
 *                 data: { $ref: '#/components/schemas/Company' }
 *                 message: { type: string, example: "Empresa encontrada" }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class GetCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const getCompanyUseCase = container.resolve(GetCompanyUseCase)
    const { id } = request.params

    console.log('GetCompanyController.handle:', { id })
    
    const result = await getCompanyUseCase.execute(id)

    if (!result.success) {
      console.error('GetCompanyController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'COMPANY_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('GetCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
