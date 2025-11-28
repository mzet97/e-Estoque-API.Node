import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import UpdateCompanyUseCase from './UpdateCompanyUseCase'
import UpdateCompanyViewModel from '../../viewModels/UpdateCompanyViewModel'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company
 *     description: Updates an existing company with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Company unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
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
 *                 message: { type: string, example: "Empresa atualizada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class UpdateCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const updateCompanyUseCase = container.resolve(UpdateCompanyUseCase)
    const { id } = request.params
    const viewModel = request.body as UpdateCompanyViewModel

    console.log('UpdateCompanyController.handle:', { id, ...viewModel })
    
    const result = await updateCompanyUseCase.execute({ id, viewModel })

    if (!result.success) {
      console.error('UpdateCompanyController.handle:', { message: result.message })
      
      const statusCode = result.message.includes('não encontrada') ? 404 : 400
      
      response.status(statusCode).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('UpdateCompanyController.handle:', { id, message: result.message })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
