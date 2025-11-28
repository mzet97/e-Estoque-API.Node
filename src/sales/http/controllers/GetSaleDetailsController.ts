import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import GetSaleDetailsUseCase from '../../useCases/getSaleDetails/GetSaleDetailsUseCase'
import { GetSaleDetailsViewModel } from '../../useCases/getSaleDetails/GetSaleDetailsUseCase'

export default class GetSaleDetailsController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const getSaleDetailsUseCase = container.resolve(GetSaleDetailsUseCase)
      const { id } = request.params

      const viewModel: GetSaleDetailsViewModel = {
        saleId: id
      }

      const result = await getSaleDetailsUseCase.execute(viewModel)

      if (!result.success) {
        response.status(404).json({
          success: false,
          data: null,
          message: result.message
        })
        return
      }

      response.json({
        success: true,
        data: result.data,
        message: result.message
      })
    } catch (error) {
      console.error('Error in GetSaleDetailsController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}