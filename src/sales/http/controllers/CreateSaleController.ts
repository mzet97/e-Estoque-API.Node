import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import CreateSaleUseCase from '../../useCases/createSale/CreateSaleUseCase'

export default class CreateSaleController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const createSaleUseCase = container.resolve(CreateSaleUseCase)
    
    const result = await createSaleUseCase.execute(request.body)

    if (!result.success) {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message
      })
      return
    }

    response.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    })
  }
}