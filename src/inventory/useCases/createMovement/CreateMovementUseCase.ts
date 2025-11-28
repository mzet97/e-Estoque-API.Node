import { inject, injectable } from 'tsyringe'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import IInventoryRepository from '../../repositories/IInventoryRepository'
import Inventory, { MovementType, MovementReason } from '../../entities/Inventory'
import { InventoryFilters } from '../../repositories/IInventoryRepository'

export interface CreateMovementViewModel {
  productId: string
  companyId: string
  userId: string
  movementType: MovementType
  movementReason: MovementReason
  quantity: number
  currentQuantity: number
  referenceId?: string
  referenceType?: string
  referenceNumber?: string
  unitCost?: number
  unitPrice?: number
  location?: string
  warehouseZone?: string
  notes?: string
}

@injectable()
export default class CreateMovementUseCase implements IUseCase<CreateMovementViewModel, Inventory> {
  constructor(
    @inject('InventoryRepository')
    private inventoryRepository: IInventoryRepository,
  ) {}

  async execute(viewModel: CreateMovementViewModel): Promise<IResult<Inventory>> {
    try {
      // Verificar se a quantidade é válida
      if (viewModel.quantity <= 0) {
        return {
          success: false,
          data: null,
          message: 'Quantidade deve ser maior que zero'
        }
      }

      // Verificar se a quantidade atual é válida
      if (viewModel.currentQuantity < 0) {
        return {
          success: false,
          data: null,
          message: 'Quantidade atual não pode ser negativa'
        }
      }

      // Para saídas, verificar se há estoque suficiente
      if (viewModel.movementType === MovementType.OUT && viewModel.currentQuantity < viewModel.quantity) {
        return {
          success: false,
          data: null,
          message: 'Estoque insuficiente para realizar esta saída'
        }
      }

      // Calcular nova quantidade após o movimento
      const newQuantity = viewModel.movementType === MovementType.IN 
        ? viewModel.currentQuantity + viewModel.quantity
        : viewModel.currentQuantity - viewModel.quantity

      if (newQuantity < 0) {
        return {
          success: false,
          data: null,
          message: 'Resultado da operação deixaria o estoque negativo'
        }
      }

      // Criar o movimento de estoque
      const movement = Inventory.create(
        viewModel.productId,
        viewModel.companyId,
        viewModel.userId,
        viewModel.movementType,
        viewModel.movementReason,
        viewModel.quantity,
        viewModel.currentQuantity,
        viewModel.referenceId,
        viewModel.referenceType,
        viewModel.referenceNumber,
        viewModel.unitCost,
        viewModel.unitPrice,
        viewModel.location,
        viewModel.warehouseZone,
        viewModel.notes
      )

      // Validar se o movimento está correto
      if (!movement.isValid()) {
        return {
          success: false,
          data: null,
          message: 'Dados do movimento são inválidos'
        }
      }

      // Salvar no banco de dados
      const result = await this.inventoryRepository.createMovement(movement)

      if (!result.success) {
        return {
          success: false,
          data: null,
          message: 'Erro ao salvar movimento no banco de dados'
        }
      }

      return {
        success: true,
        data: result.data!,
        message: 'Movimento de estoque criado com sucesso'
      }
    } catch (error) {
      console.error('Error in CreateMovementUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao criar movimento de estoque'
      }
    }
  }
}