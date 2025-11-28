import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ISalesRepository, { SaleFilters } from '../../repositories/ISalesRepository'
import Sale from '../../entities/Sale'

export interface ListSalesViewModel {
  customerId?: string
  companyId?: string
  saleNumber?: string
  status?: string
  saleType?: string
  paymentType?: string
  minTotalAmount?: number
  maxTotalAmount?: number
  minSaleDate?: string
  maxSaleDate?: string
  hasDeliveryAddress?: boolean
  isOverdue?: boolean
  isCreditSale?: boolean
  hasTrackingCode?: boolean
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  search?: string
}

@injectable()
export default class ListSalesUseCase implements IUseCase<ListSalesViewModel, IPaginationResult<Sale>> {
  constructor(
    @inject('SalesRepository')
    private salesRepository: ISalesRepository,
  ) {}

  async execute(viewModel: ListSalesViewModel): Promise<IResult<IPaginationResult<Sale>>> {
    try {
      // Converter ViewModel para filtros do repository
      const filters: SaleFilters = {
        customerId: viewModel.customerId,
        companyId: viewModel.companyId,
        saleNumber: viewModel.saleNumber,
        status: viewModel.status as any,
        saleType: viewModel.saleType as any,
        paymentType: viewModel.paymentType as any,
        minTotalAmount: viewModel.minTotalAmount,
        maxTotalAmount: viewModel.maxTotalAmount,
        minSaleDate: viewModel.minSaleDate ? new Date(viewModel.minSaleDate) : undefined,
        maxSaleDate: viewModel.maxSaleDate ? new Date(viewModel.maxSaleDate) : undefined,
        hasDeliveryAddress: viewModel.hasDeliveryAddress,
        isOverdue: viewModel.isOverdue,
        isCreditSale: viewModel.isCreditSale,
        hasTrackingCode: viewModel.hasTrackingCode,
        page: viewModel.page || 1,
        pageSize: viewModel.pageSize || 10,
        orderBy: (viewModel.orderBy as any) || 'saleDate',
        orderDirection: viewModel.orderDirection || 'DESC',
        search: viewModel.search
      }

      // Buscar vendas com filtros
      const result = await this.salesRepository.findWithFilters(filters)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao buscar vendas'
        }
      }

      // Adicionar cálculos às vendas encontradas
      const salesWithCalculations = result.data.map(sale => ({
        ...sale,
        profit: sale.calculateProfit(),
        profitMargin: sale.calculateProfitMargin(),
        daysSinceSale: sale.getDaysSinceSale(),
        isOverdue: sale.isOverdue(),
        isDueSoon: sale.isDueSoon(),
        canBeEdited: sale.canBeEdited(),
        canBeCancelled: sale.canBeCancelled()
      }))

      return {
        success: true,
        data: {
          ...result.pagination,
          data: salesWithCalculations
        },
        message: 'Vendas encontradas com sucesso'
      }
    } catch (error) {
      console.error('Error in ListSalesUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar vendas'
      }
    }
  }
}