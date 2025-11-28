import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IInventoryRepository from '../../repositories/IInventoryRepository'
import { StockFilters } from '../../repositories/IInventoryRepository'

export interface ListMovementsViewModel {
  productId?: string
  companyId?: string
  userId?: string
  movementType?: string
  movementReason?: string
  status?: string
  qualityStatus?: string
  referenceType?: string
  referenceId?: string
  minQuantity?: number
  maxQuantity?: number
  minDate?: string
  maxDate?: string
  location?: string
  warehouseZone?: string
  hasExpiryDate?: boolean
  isExpired?: boolean
  isNearExpiry?: boolean
  hasSerialNumbers?: boolean
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  search?: string
}

@injectable()
export default class ListMovementsUseCase implements IUseCase<ListMovementsViewModel, any> {
  constructor(
    @inject('InventoryRepository')
    private inventoryRepository: IInventoryRepository,
  ) {}

  async execute(viewModel: ListMovementsViewModel): Promise<IResult<any>> {
    try {
      // Converter ViewModel para filtros do repository
      const filters: StockFilters = {
        productId: viewModel.productId,
        companyId: viewModel.companyId,
        // movementType e movementReason seriam convertidos para os enums corretos
        minQuantity: viewModel.minQuantity,
        maxQuantity: viewModel.maxQuantity,
        minDate: viewModel.minDate ? new Date(viewModel.minDate) : undefined,
        maxDate: viewModel.maxDate ? new Date(viewModel.maxDate) : undefined,
        location: viewModel.location,
        warehouseZone: viewModel.warehouseZone,
        hasExpiryDate: viewModel.hasExpiryDate,
        isExpired: viewModel.isExpired,
        isNearExpiry: viewModel.isNearExpiry,
        hasSerialNumbers: viewModel.hasSerialNumbers,
        page: viewModel.page || 1,
        pageSize: viewModel.pageSize || 20,
        orderBy: (viewModel.orderBy as any) || 'createdAt',
        orderDirection: viewModel.orderDirection || 'DESC',
        search: viewModel.search
      }

      // Buscar movimentos com filtros
      const result = await this.inventoryRepository.findMovementsWithFilters(filters as any)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao buscar movimentos de estoque'
        }
      }

      // Adicionar informações derivadas a cada movimento
      const movementsWithCalculations = result.data.map(movement => ({
        ...movement,
        totalValue: movement.calculateTotalValue(),
        totalCost: movement.calculateTotalCost(),
        isEntry: movement.isEntry(),
        isExit: movement.isExit(),
        isSale: movement.isSale(),
        isPurchase: movement.isPurchase(),
        isAdjustment: movement.isAdjustment(),
        isExpired: movement.isExpired(),
        isNearExpiry: movement.isNearExpiry(),
        isGoodQuality: movement.isGoodQuality(),
        canBeEdited: movement.canBeEdited(),
        canBeCancelled: movement.canBeCancelled(),
        isActive: movement.isActive()
      }))

      return {
        success: true,
        data: {
          ...result.pagination,
          data: movementsWithCalculations
        },
        message: 'Movimentos de estoque encontrados com sucesso'
      }
    } catch (error) {
      console.error('Error in ListMovementsUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar movimentos de estoque'
      }
    }
  }
}