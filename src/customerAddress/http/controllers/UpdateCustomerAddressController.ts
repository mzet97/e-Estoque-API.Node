import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import UpdateCustomerAddressUseCase from '../../useCases/updateCustomerAddress/UpdateCustomerAddressUseCase'
import CustomerAddressViewModel from '../../viewModels/CustomerAddressViewModel'

/**
 * @swagger
 * /customer-addresses/{id}:
 *   put:
 *     tags: [Customer Addresses]
 *     summary: Update a customer address
 *     description: Updates an existing customer address with the provided data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Customer address unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerAddressRequest'
 *           examples:
 *             update_address:
 *               summary: Update address
 *               value:
 *                 street: "Rua das Palmeiras"
 *                 number: "789"
 *                 complement: "Casa 2"
 *                 district: "Vila Madalena"
 *             update_city:
 *               summary: Update city
 *               value:
 *                 city: "Belo Horizonte"
 *                 state: "MG"
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
 *                   $ref: '#/components/schemas/CustomerAddress'
 *                 message: { type: string, example: "Endereço do cliente atualizado com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class UpdateCustomerAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const viewModel = request.body as CustomerAddressViewModel
    const updateCustomerAddressUseCase = container.resolve(UpdateCustomerAddressUseCase)

    const result = await updateCustomerAddressUseCase.execute(id, viewModel)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'UPDATE_CUSTOMER_ADDRESS_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = CustomerAddressViewModel.fromCustomerAddress(result.data)
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}