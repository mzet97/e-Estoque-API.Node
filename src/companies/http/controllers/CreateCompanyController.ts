import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCompanyUseCase from './CreateCompanyUseCase'
import CreateCompanyViewModel from '../../viewModels/CreateCompanyViewModel'
import ShowCompanyViewModel from '../../viewModels/ShowCompanyViewModel'

/**
 * @swagger
 * /companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     description: Creates a new company with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *           example:
 *             name: "Empresa Exemplo Ltda"
 *             docId: "12.345.678/0001-90"
 *             email: "contato@empresa.com"
 *             description: "Descrição da empresa"
 *             phoneNumber: "(11) 99999-9999"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Company' }
 *                 message: { type: string, example: "Empresa criada com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CreateCompanyController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCompanyUseCase = container.resolve(CreateCompanyUseCase)
    const viewModel = request.body as CreateCompanyViewModel

    console.log('CreateCompanyController.handle:', { name: viewModel.name, email: viewModel.email })
    
    const result = await createCompanyUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCompanyController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_COMPANY_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCompanyViewModel.fromCompany(result.data)

    console.log('CreateCompanyController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}
