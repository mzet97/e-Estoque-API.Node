import { Repository, Like, ILike } from 'typeorm'
import { injectable } from 'tsyringe'
import Sale, { SaleStatus, SaleType, PaymentType } from '../entities/Sale'
import ISalesRepository, { SaleFilters, SaleStatistics } from './ISalesRepository'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { getDataSource } from '@shared/typeorm'

@injectable()
export class SalesRepository implements ISalesRepository {
  private repository: Repository<Sale>

  constructor() {
    this.repository = getDataSource().getRepository(Sale)
  }

  async create(sale: Sale): Promise<IResult<Sale>> {
    try {
      const savedSale = await this.repository.save(sale)
      return { success: true, data: savedSale, message: 'Sale created successfully' }
    } catch (error) {
      console.error('Error creating sale:', error)
      return { success: false, data: null, message: 'Failed to create sale' }
    }
  }

  async findById(id: string): Promise<IResult<Sale>> {
    try {
      const sale = await this.repository.findOne({ where: { id } })
      if (!sale) {
        return { success: false, data: null, message: 'Sale not found' }
      }
      return { success: true, data: sale, message: 'Sale found successfully' }
    } catch (error) {
      console.error('Error finding sale by ID:', error)
      return { success: false, data: null, message: 'Failed to find sale' }
    }
  }

  async findBySaleNumber(saleNumber: string): Promise<IResult<Sale>> {
    try {
      const sale = await this.repository.findOne({ where: { saleNumber } })
      if (!sale) {
        return { success: false, data: null, message: 'Sale not found' }
      }
      return { success: true, data: sale, message: 'Sale found successfully' }
    } catch (error) {
      console.error('Error finding sale by sale number:', error)
      return { success: false, data: null, message: 'Failed to find sale' }
    }
  }

  async findWithFilters(filters: SaleFilters): Promise<IPaginationResult<Sale>> {
    try {
      const {
        customerId,
        companyId,
        saleNumber,
        status,
        saleType,
        paymentType,
        minTotalAmount,
        maxTotalAmount,
        search,
        page = 1,
        pageSize = 20,
        orderBy = 'createdAt',
        orderDirection = 'DESC'
      } = filters

      const queryBuilder = this.repository.createQueryBuilder('sale')
      
      if (search) {
        queryBuilder.andWhere(
          '(sale.saleNumber ILIKE :search OR sale.notes ILIKE :search OR sale.internalNotes ILIKE :search)',
          { search: `%${search}%` }
        )
      }

      if (customerId) queryBuilder.andWhere('sale.customerId = :customerId', { customerId })
      if (companyId) queryBuilder.andWhere('sale.companyId = :companyId', { companyId })
      if (saleNumber) queryBuilder.andWhere('sale.saleNumber ILIKE :saleNumber', { saleNumber: `%${saleNumber}%` })
      if (status) queryBuilder.andWhere('sale.status = :status', { status })
      if (saleType) queryBuilder.andWhere('sale.saleType = :saleType', { saleType })
      if (paymentType) queryBuilder.andWhere('sale.paymentType = :paymentType', { paymentType })
      if (minTotalAmount) queryBuilder.andWhere('sale.totalAmount >= :minTotalAmount', { minTotalAmount })
      if (maxTotalAmount) queryBuilder.andWhere('sale.totalAmount <= :maxTotalAmount', { maxTotalAmount })

      queryBuilder.orderBy(`sale.${orderBy}`, orderDirection)

      const totalItems = await queryBuilder.getCount()
      const offset = (page - 1) * pageSize
      queryBuilder.skip(offset).take(pageSize)

      const items = await queryBuilder.getMany()
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        success: true,
        data: {
          items,
          pagination: {
            currentPage: page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        message: 'Sales retrieved successfully'
      }
    } catch (error) {
      console.error('Error finding sales with filters:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            pageSize: filters.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Failed to retrieve sales'
      }
    }
  }

  async update(id: string, updateData: Partial<Sale>): Promise<IResult<Sale>> {
    try {
      const existingSaleResult = await this.findById(id)
      if (!existingSaleResult.success) return existingSaleResult

      const updatedSale = Object.assign(existingSaleResult.data, {
        ...updateData,
        updatedAt: new Date()
      })

      const savedSale = await this.repository.save(updatedSale)
      return { success: true, data: savedSale, message: 'Sale updated successfully' }
    } catch (error) {
      console.error('Error updating sale:', error)
      return { success: false, data: null, message: 'Failed to update sale' }
    }
  }

  async delete(id: string): Promise<IResult<void>> {
    try {
      const existingSaleResult = await this.findById(id)
      if (!existingSaleResult.success) return existingSaleResult

      existingSaleResult.data.delete()
      await this.repository.save(existingSaleResult.data)
      return { success: true, data: null, message: 'Sale deleted successfully' }
    } catch (error) {
      console.error('Error deleting sale:', error)
      return { success: false, data: null, message: 'Failed to delete sale' }
    }
  }

  async restore(id: string): Promise<IResult<void>> {
    try {
      const existingSaleResult = await this.findById(id)
      if (!existingSaleResult.success) return existingSaleResult

      existingSaleResult.data.restore()
      await this.repository.save(existingSaleResult.data)
      return { success: true, data: null, message: 'Sale restored successfully' }
    } catch (error) {
      console.error('Error restoring sale:', error)
      return { success: false, data: null, message: 'Failed to restore sale' }
    }
  }

  async findAllActive(): Promise<IResult<Sale[]>> {
    try {
      const sales = await this.repository.find({
        where: { isDeleted: false },
        order: { saleDate: 'DESC' }
      })
      return { success: true, data: sales, message: 'Active sales retrieved successfully' }
    } catch (error) {
      console.error('Error finding active sales:', error)
      return { success: false, data: [], message: 'Failed to retrieve active sales' }
    }
  }

  async findAll(page = 1, pageSize = 20): Promise<IPaginationResult<Sale>> {
    const filters: SaleFilters = { page, pageSize, orderBy: 'createdAt', orderDirection: 'DESC' }
    return this.findWithFilters(filters)
  }

  async existsBySaleNumber(saleNumber: string): Promise<boolean> {
    try {
      const result = await this.findBySaleNumber(saleNumber)
      return result.success
    } catch (error) {
      console.error('Error checking if sale exists by sale number:', error)
      return false
    }
  }

  async findByStatus(status: SaleStatus): Promise<IResult<Sale[]>> {
    try {
      const sales = await this.repository.find({ where: { status, isDeleted: false } })
      return { success: true, data: sales, message: 'Sales by status retrieved successfully' }
    } catch (error) {
      console.error('Error finding sales by status:', error)
      return { success: false, data: [], message: 'Failed to retrieve sales by status' }
    }
  }

  async count(): Promise<number> {
    try { return await this.repository.count() } catch (error) { console.error('Error counting sales:', error); return 0 }
  }

  async countActive(): Promise<number> {
    try { return await this.repository.count({ where: { isDeleted: false } }) } catch (error) { console.error('Error counting active sales:', error); return 0 }
  }

  async getStatistics(startDate?: Date, endDate?: Date): Promise<IResult<SaleStatistics>> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('sale')
      if (startDate) queryBuilder.andWhere('sale.saleDate >= :startDate', { startDate })
      if (endDate) queryBuilder.andWhere('sale.saleDate <= :endDate', { endDate })

      const sales = await queryBuilder.getMany()
      
      const totalSales = sales.length
      const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalAmount - sale.totalCost), 0)
      const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0

      const statistics: SaleStatistics = {
        totalSales,
        totalAmount,
        totalProfit,
        averageTicket,
        salesByStatus: {} as Record<SaleStatus, number>,
        salesByType: {} as Record<SaleType, number>,
        salesByPaymentType: {} as Record<PaymentType, number>,
        salesByMonth: {},
        overdueSales: sales.filter(sale => sale.isOverdue()).length,
        pendingSales: sales.filter(sale => sale.status === SaleStatus.PENDING).length,
        completedSales: sales.filter(sale => sale.isCompleted()).length
      }

      // Populate detailed counts
      Object.values(SaleStatus).forEach(status => {
        statistics.salesByStatus[status] = sales.filter(sale => sale.status === status).length
      })

      return { success: true, data: statistics, message: 'Statistics retrieved successfully' }
    } catch (error) {
      console.error('Error getting sales statistics:', error)
      return { success: false, data: {} as SaleStatistics, message: 'Failed to retrieve statistics' }
    }
  }

  async findByCustomer(customerId: string): Promise<IResult<Sale[]>> {
    try {
      const sales = await this.repository.find({ where: { customerId, isDeleted: false } })
      return { success: true, data: sales, message: 'Customer sales retrieved successfully' }
    } catch (error) {
      console.error('Error finding sales by customer:', error)
      return { success: false, data: [], message: 'Failed to retrieve customer sales' }
    }
  }

  async findByCompany(companyId: string): Promise<IResult<Sale[]>> {
    try {
      const sales = await this.repository.find({ where: { companyId, isDeleted: false } })
      return { success: true, data: sales, message: 'Company sales retrieved successfully' }
    } catch (error) {
      console.error('Error finding sales by company:', error)
      return { success: false, data: [], message: 'Failed to retrieve company sales' }
    }
  }

  async findOverdueSales(): Promise<IResult<Sale[]>> {
    try {
      const sales = await this.repository.find({ where: { isDeleted: false } })
      const overdueSales = sales.filter(sale => sale.isOverdue())
      return { success: true, data: overdueSales, message: 'Overdue sales retrieved successfully' }
    } catch (error) {
      console.error('Error finding overdue sales:', error)
      return { success: false, data: [], message: 'Failed to retrieve overdue sales' }
    }
  }

  async searchSales(searchTerm: string): Promise<IResult<Sale[]>> {
    try {
      const filters: SaleFilters = { search: searchTerm, isActive: true }
      const result = await this.findWithFilters(filters)
      return { success: result.success, data: result.data.items, message: result.message }
    } catch (error) {
      console.error('Error searching sales:', error)
      return { success: false, data: [], message: 'Failed to search sales' }
    }
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('sale')
        .select('SUM(sale.totalAmount)', 'total')
      if (startDate) queryBuilder.andWhere('sale.saleDate >= :startDate', { startDate })
      if (endDate) queryBuilder.andWhere('sale.saleDate <= :endDate', { endDate })
      
      const result = await queryBuilder.getRawOne()
      return parseFloat(result?.total || '0')
    } catch (error) {
      console.error('Error calculating total revenue:', error)
      return 0
    }
  }

  async getSaleWithProducts(saleId: string): Promise<IResult<Sale>> {
    return this.findById(saleId)
  }

  async getSaleWithDetails(saleId: string): Promise<IResult<Sale>> {
    return this.findById(saleId)
  }

  async generateSalesReport(filters: SaleFilters): Promise<IResult<any>> {
    try {
      const result = await this.findWithFilters(filters)
      return { success: true, data: result.data, message: 'Sales report generated successfully' }
    } catch (error) {
      console.error('Error generating sales report:', error)
      return { success: false, data: null, message: 'Failed to generate sales report' }
    }
  }

  // Stub implementations for remaining methods
  async findBySaleType(saleType: SaleType): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findByPaymentType(paymentType: PaymentType): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findByDateRange(startDate: Date, endDate: Date): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findPendingSales(): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findCreditSales(): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findCashSales(): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findSalesWithDeliveryAddress(): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async findSalesByCustomerSegment(personType: 'FISICA' | 'JURIDICA'): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getSalesSummaryByStatus(): Promise<IResult<Record<SaleStatus, number>>> { return { success: false, data: {} as Record<SaleStatus, number>, message: 'Not implemented' } }
  async getSalesSummaryByType(): Promise<IResult<Record<SaleType, number>>> { return { success: false, data: {} as Record<SaleType, number>, message: 'Not implemented' } }
  async getSalesSummaryByPaymentType(): Promise<IResult<Record<PaymentType, number>>> { return { success: false, data: {} as Record<PaymentType, number>, message: 'Not implemented' } }
  async getTopSellingProducts(limit?: number): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getSalesByMonth(year?: number): Promise<IResult<Record<string, number>>> { return { success: false, data: {}, message: 'Not implemented' } }
  async getTotalProfit(startDate?: Date, endDate?: Date): Promise<number> { return 0 }
  async getAverageTicketValue(startDate?: Date, endDate?: Date): Promise<number> { return 0 }
  async getConversionRate(startDate?: Date, endDate?: Date): Promise<number> { return 0 }
  async getCustomerLifetimeValue(customerId: string): Promise<number> { return 0 }
  async getRepeatCustomerRate(startDate?: Date, endDate?: Date): Promise<number> { return 0 }
  async getSalesPerformance(period: 'day' | 'week' | 'month' | 'year'): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getBestSellingCategories(limit?: number): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getSalesTrends(period: 'day' | 'week' | 'month'): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getSalesForecast(monthsAhead?: number): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async updateInventoryForSale(saleId: string, saleProducts: any[]): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async reserveInventory(saleId: string, productId: string, quantity: number): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async releaseInventoryReservation(saleId: string, productId: string, quantity: number): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async confirmInventorySale(saleId: string, productId: string, quantity: number): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async findSaleWithProducts(saleId: string): Promise<IResult<Sale>> { return this.findById(saleId) }
  async findSaleWithCustomer(saleId: string): Promise<IResult<Sale>> { return this.findById(saleId) }
  async findSalesByProduct(productId: string): Promise<IResult<Sale[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async countByStatus(status: SaleStatus): Promise<number> { return 0 }
  async countBySaleType(saleType: SaleType): Promise<number> { return 0 }
  async countByPaymentType(paymentType: PaymentType): Promise<number> { return 0 }
  async countOverdue(): Promise<number> { return 0 }
  async countPending(): Promise<number> { return 0 }
  async countCompleted(): Promise<number> { return 0 }
  async countByDateRange(startDate: Date, endDate: Date): Promise<number> { return 0 }
  async generateCustomerReport(customerId: string): Promise<IResult<any>> { return { success: false, data: null, message: 'Not implemented' } }
  async generateProductSalesReport(productId: string, startDate?: Date, endDate?: Date): Promise<IResult<any>> { return { success: false, data: null, message: 'Not implemented' } }
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<IResult<any>> { return { success: false, data: null, message: 'Not implemented' } }
  async generateInventoryMovementReport(startDate: Date, endDate: Date): Promise<IResult<any>> { return { success: false, data: null, message: 'Not implemented' } }
  async bulkUpdateStatus(saleIds: string[], status: SaleStatus): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async bulkUpdatePaymentStatus(saleIds: string[], paymentStatus: string): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async cleanupOldDraftSales(daysOld?: number): Promise<IResult<number>> { return { success: false, data: 0, message: 'Not implemented' } }
  async optimizeIndexes(): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
  async validateSaleIntegrity(saleId: string): Promise<IResult<boolean>> { return { success: false, data: false, message: 'Not implemented' } }
  async fixOrphanedSales(): Promise<IResult<number>> { return { success: false, data: 0, message: 'Not implemented' } }
  async recalculateSaleTotals(saleId: string): Promise<IResult<Sale>> { return { success: false, data: null, message: 'Not implemented' } }
  async getSaleHistory(saleId: string): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getAuditLog(startDate?: Date, endDate?: Date): Promise<IResult<any[]>> { return { success: false, data: [], message: 'Not implemented' } }
  async getSaleConfiguration(): Promise<IResult<any>> { return { success: false, data: null, message: 'Not implemented' } }
  async updateSaleConfiguration(config: any): Promise<IResult<void>> { return { success: false, data: null, message: 'Not implemented' } }
}