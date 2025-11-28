import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCompanyAddressUseCase from '../../useCases/createCompanyAddress/CreateCompanyAddressUseCase'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

/**
 * @swagger
 * /company-addresses:
 *   post:
 *     tags: [Company Addresses]
 *     summary: Create a new company address
 *     description: Creates a new company address in the system with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyAddressRequest'
 *           examples:
 *             create_headquarters:
 *               summary: Create headquarters address
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                 type: "HEADQUARTERS"
 *                 street: "Avenida Paulista"
 *                 number: "1000"
 *                 complement: "10º andar"
 *                 district: "Bela Vista"
 *                 city: "São Paulo"
 *                 state: "SP"
 *                 country: "Brasil"
 *                 zipCode: "01310-100"
 *                 isHeadquarters: true
 *             create_branch:
 *               summary: Create branch address
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                 type: "BRANCH"
 *                 street: "Rua das Flores"
 *                 number: "123"
 *                 district: "Centro"
 *                 city: "Rio de Janeiro"
 *                 state: "RJ"
 *                 country: "Brasil"
 *                 zipCode: "20000-000"
 *                 department: "Vendas"
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
 *                   $ref: '#/components/schemas/CompanyAddress'
 *                 message: { type: string, example: "Endereço da empresa criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class CreateCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCompanyAddressUseCase = container.resolve(CreateCompanyAddressUseCase)
    const viewModel = request.body as CompanyAddressViewModel

    console.log('CreateCompanyAddressController.handle:', { 
      type: viewModel.type,
      companyId: viewModel.companyId,
      city: viewModel.city
    })
    
    const result = await createCompanyAddressUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCompanyAddressController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_COMPANY_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CompanyAddressViewModel.fromCompanyAddress(result.data)

    console.log('CreateCompanyAddressController.handle:', { 
      id: viewModelResult.id, 
      type: viewModelResult.type,
      message: result.message 
    })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}