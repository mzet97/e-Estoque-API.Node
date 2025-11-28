import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import GetCompanyAddressUseCase from '../../useCases/getCompanyAddress/GetCompanyAddressUseCase'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

/**
 * @swagger
 * /company-addresses/{id}:
 *   get:
 *     tags: [Company Addresses]
 *     summary: Get company address by ID
 *     description: Returns a single company address by its unique identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Company address unique identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: includeCompany
 *         schema: { type: boolean, default: true }
 *         description: Include company data in response
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
 *                   $ref: '#/components/schemas/CompanyAddress'
 *                 message: { type: string, example: "Endereço da empresa encontrado" }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default class GetCompanyAddressController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const includeCompany = request.query.includeCompany !== 'false'
    const getCompanyAddressUseCase = container.resolve(GetCompanyAddressUseCase)

    console.log('GetCompanyAddressController.handle:', { id, includeCompany })
    
    const result = await getCompanyAddressUseCase.execute(id)

    if (!result.success) {
      console.error('GetCompanyAddressController.handle:', { message: result.message })
      response.status(404).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'COMPANY_ADDRESS_NOT_FOUND', message: result.message }]
      })
      return
    }

    const viewModelResult = CompanyAddressViewModel.fromCompanyAddress(result.data, includeCompany)

    console.log('GetCompanyAddressController.handle:', { 
      id: viewModelResult.id, 
      type: viewModelResult.type,
      message: result.message 
    })
    
    response.status(200).json({
      success: true,
      data: viewModelResult,
      message: result.message
    })
  }
}