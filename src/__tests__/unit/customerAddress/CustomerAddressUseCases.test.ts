import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => () => {},
  container: { resolve: jest.fn() }
}))

import CreateCustomerAddressUseCase from '../../../customerAddress/useCases/createCustomerAddress/CreateCustomerAddressUseCase'
import GetCustomerAddressUseCase from '../../../customerAddress/useCases/getCustomerAddress/GetCustomerAddressUseCase'
import UpdateCustomerAddressUseCase from '../../../customerAddress/useCases/updateCustomerAddress/UpdateCustomerAddressUseCase'
import DeleteCustomerAddressUseCase from '../../../customerAddress/useCases/deleteCustomerAddress/DeleteCustomerAddressUseCase'
import ListCustomerAddressesUseCase from '../../../customerAddress/useCases/listCustomerAddresses/ListCustomerAddressesUseCase'

describe('CustomerAddress Use Cases', () => {
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findWithFilters: jest.fn()
    }
  })

  describe('CreateCustomerAddressUseCase', () => {
    it('should create address successfully', async () => {
      const useCase = new CreateCustomerAddressUseCase()
      // Mock the repository constructor
      ;(useCase as any).customerAddressesRepository = mockRepository

      const validData = {
        type: 'shipping' as const,
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        customerId: 'customer-1'
      }

      ;(mockRepository.create as any).mockResolvedValue({
        success: true,
        data: { id: 'addr-1', ...validData },
        message: 'Endereço criado com sucesso'
      })

      const result = await useCase.execute(validData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('addr-1')
    })

    it('should reject invalid data', async () => {
      const useCase = new CreateCustomerAddressUseCase()
      ;(useCase as any).customerAddressesRepository = mockRepository

      const invalidData = {
        type: 'shipping' as const,
        street: '', // Invalid - empty
        number: '123',
        neighborhood: 'Centro',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        customerId: 'customer-1'
      }

      const result = await useCase.execute(invalidData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Dados inválidos')
    })
  })

  describe('GetCustomerAddressUseCase', () => {
    it('should get address by id', async () => {
      const useCase = new GetCustomerAddressUseCase()
      ;(useCase as any).customerAddressesRepository = mockRepository

      ;(mockRepository.findById as any).mockResolvedValue({
        success: true,
        data: { id: 'addr-1', street: 'Rua Teste' }
      })

      const result = await useCase.execute('addr-1')

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('addr-1')
    })
  })

  describe('UpdateCustomerAddressUseCase', () => {
    it('should update address successfully', async () => {
      const useCase = new UpdateCustomerAddressUseCase()
      ;(useCase as any).customerAddressesRepository = mockRepository

      ;(mockRepository.update as any).mockResolvedValue({
        success: true,
        data: { id: 'addr-1', street: 'Rua Atualizada' },
        message: 'Atualizado com sucesso'
      })

      const result = await useCase.execute('addr-1', { street: 'Rua Atualizada' })

      expect(result.success).toBe(true)
    })
  })

  describe('DeleteCustomerAddressUseCase', () => {
    it('should delete address successfully', async () => {
      const useCase = new DeleteCustomerAddressUseCase()
      ;(useCase as any).customerAddressesRepository = mockRepository

      ;(mockRepository.delete as any).mockResolvedValue({
        success: true,
        message: 'Deletado com sucesso'
      })

      const result = await useCase.execute('addr-1')

      expect(result.success).toBe(true)
    })
  })

  describe('ListCustomerAddressesUseCase', () => {
    it('should list addresses with filters', async () => {
      const useCase = new ListCustomerAddressesUseCase()
      ;(useCase as any).customerAddressesRepository = mockRepository

      ;(mockRepository.findWithFilters as any).mockResolvedValue({
        success: true,
        data: [{ id: 'addr-1' }, { id: 'addr-2' }],
        pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }
      })

      const result = await useCase.execute({ customerId: 'customer-1' })

      expect(result.data).toHaveLength(2)
    })
  })
})
