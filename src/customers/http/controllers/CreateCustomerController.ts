import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCustomerUseCase from '../../useCases/createCustomer/CreateCustomerUseCase'
import CreateCustomerViewModel from '../../viewModels/CreateCustomerViewModel'
import ShowCustomerViewModel from '../../viewModels/ShowCustomerViewModel'

/**
 * @swagger
 * /customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer
 *     description: Creates a new customer with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerRequest'
 *           examples:
 *             pessoa_fisica:
 *               summary: Customer - Individual
 *               value:
 *                 name: "João da Silva"
 *                 email: "joao.silva@email.com"
 *                 phoneNumber: "(11) 99999-9999"
 *                 personType: "FISICA"
 *                 docId: "123.456.789-00"
 *             pessoa_juridica:
 *               summary: Customer - Company
 *               value:
 *                 name: "Empresa ABC Ltda"
 *                 email: "contato@empresaabc.com"
 *                 phoneNumber: "(11) 3333-3333"
 *                 personType: "JURIDICA"
 *                 docId: "12.345.678/0001-90"
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
 *                   $ref: '#/components/schemas/Customer'
 *                 message: { type: string, example: "Cliente criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export default class CreateCustomerController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCustomerUseCase = container.resolve(CreateCustomerUseCase)
    const viewModel = request.body as CreateCustomerViewModel

    console.log('CreateCustomerController.handle:', { name: viewModel.name, email: viewModel.email })
    
    const result = await createCustomerUseCase.execute(viewModel)

    if (!result.success) {
      console.error('CreateCustomerController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CUSTOMER_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = ShowCustomerViewModel.fromCustomer(result.data)

    console.log('CreateCustomerController.handle:', { id: viewModelResult.id, message: result.message })
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}