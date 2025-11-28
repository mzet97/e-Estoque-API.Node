import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import DeleteTaxUseCase from '../../useCases/deleteTax/DeleteTaxUseCase'

export default class DeleteTaxController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const { id } = request.params
    const deleteTaxUseCase = container.resolve(DeleteTaxUseCase)

    const result = await deleteTaxUseCase.execute(id)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'DELETE_TAX_ERROR', message: result.message }]
      })
      return
    }

    response.status(200).json({
      success: true,
      data: null,
      message: result.message
    })
  }
}