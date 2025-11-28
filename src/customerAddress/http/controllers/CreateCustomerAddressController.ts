import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import CreateCustomerAddressUseCase from '../../useCases/createCustomerAddress/CreateCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

/**
 * @swagger
 * /customer-addresses:
 *   post:
 *     tags: [Customer Addresses]
 *     summary: Create a new customer address
 *     description: Creates a new customer address in the system with the provided data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerAddressRequest'
 *           examples:
 *             create_residential:
 *               summary: Create residential address
 *               value:
 *                 customerId: "123e4567-e89b-12d3-a456-426614174000"
 *                 type: "RESIDENTIAL"
 *                 street: "Rua das Acácias"
 *                 number: "456"
 *                 complement: "Apto 101"
 *                 district: "Jardim Botânico"
 *                 city: "São Paulo"
 *                 state: "SP"
 *                 country: "Brasil"
 *                 zipCode: "05435-020"
 *                 isDefault: true
 *             create_commercial:
 *               summary: Create commercial address
 *               value:
 *                 customerId: "123e4567-e89b-12d3-a456-426614174000"
 *                 type: "COMMERCIAL"
 *                 street: "Avenida Brazil"
 *                 number: "2000"
 *                 complement: "Sala 1205"
 *                 district: "Centro"
 *                 city: "Rio de Janeiro"
 *                 state: "RJ"
 *                 country: "Brasil"
 *                 zipCode: "20071-002"
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
 *                   $ref: '#/components/schemas/CustomerAddress'
 *                 message: { type: string, example: "Endereço do cliente criado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class CreateCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createCustomerAddressUseCase = container.resolve(CreateCustomerAddressUseCase)
    const viewModel = request.body as CustomerAddressViewModel

    const result = await createCustomerAddressUseCase.execute(viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'CREATE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data)
    
    response.status(201).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}