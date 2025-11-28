import { Request, Response } from 'express'
import { container } from 'tsyringe'
import IController from '@shared/useCases/IController'
import ListSalesUseCase from '../../useCases/listSales/ListSalesUseCase'
import { ListSalesViewModel } from '../../useCases/listSales/ListSalesUseCase'

/**
 * @swagger
 * /sales:
 *   get:
 *     tags: [Sales]
 *     summary: List all sales
 *     description: Returns a paginated list of sales with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema: { type: string, format: uuid }
 *         description: Filter by customer ID
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *         description: Filter by company ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *         description: Filter by status
 *       - in: query
 *         name: minTotalAmount
 *         schema: { type: number }
 *         description: Minimum total amount
 *       - in: query
 *         name: maxTotalAmount
 *         schema: { type: number }
 *         description: Maximum total amount
 *       - in: query
 *         name: minSaleDate
 *         schema: { type: string, format: date-time }
 *         description: Minimum sale date
 *       - in: query
 *         name: maxSaleDate
 *         schema: { type: string, format: date-time }
 *         description: Maximum sale date
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 10 }
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [saleDate, totalAmount, createdAt, updatedAt], default: createdAt }
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Order direction
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term for sale number or customer name
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
 *                   $ref: '#/components/schemas/PagedResult'
 *                 message: { type: string, example: "Vendas listadas com sucesso" }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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