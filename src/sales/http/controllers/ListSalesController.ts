import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListSalesUseCase from '../../useCases/listSales/ListSalesUseCase'
import { ListSalesViewModel } from '../../useCases/listSales/ListSalesUseCase'

export default class ListSalesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    try {
      const listSalesUseCase = container.resolve(ListSalesUseCase)
      const query = request.query

      const viewModel: ListSalesViewModel = {
        customerId: query.customerId as string,
        companyId: query.companyId as string,
        saleNumber: query.saleNumber as string,
        status: query.status as string,
        saleType: query.saleType as string,
        paymentType: query.paymentType as string,
        minTotalAmount: query.minTotalAmount ? parseFloat(query.minTotalAmount as string) : undefined,
        maxTotalAmount: query.maxTotalAmount ? parseFloat(query.maxTotalAmount as string) : undefined,
        minSaleDate: query.minSaleDate as string,
        maxSaleDate: query.maxSaleDate as string,
        hasDeliveryAddress: query.hasDeliveryAddress === 'true',
        isOverdue: query.isOverdue === 'true',
        isCreditSale: query.isCreditSale === 'true',
        hasTrackingCode: query.hasTrackingCode === 'true',
        page: query.page ? parseInt(query.page as string) : undefined,
        pageSize: query.pageSize ? parseInt(query.pageSize as string) : undefined,
        orderBy: query.orderBy as string,
        orderDirection: query.orderDirection as 'ASC' | 'DESC',
        search: query.search as string
      }

      const result = await listSalesUseCase.execute(viewModel)

      if (!result.success) {
        response.status(400).json({
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
      console.error('Error in ListSalesController:', error)
      response.status(500).json({
        success: false,
        data: null,
        message: 'Erro interno do servidor'
      })
    }
  }
}