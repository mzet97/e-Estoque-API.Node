import { Repository } from 'typeorm'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import Sale, { SaleStatus, SaleType, PaymentType } from '../entities/Sale'
import SaleProduct from '../entities/SaleProduct'

// Interface para filtros de busca de vendas
export interface SaleFilters {
  customerId?: string
  companyId?: string
  saleNumber?: string
  status?: SaleStatus
  saleType?: SaleType
  paymentType?: PaymentType
  minTotalAmount?: number
  maxTotalAmount?: number
  minSaleDate?: Date
  maxSaleDate?: Date
  minPaymentDueDate?: Date
  maxPaymentDueDate?: Date
  hasDeliveryAddress?: boolean
  isOverdue?: boolean
  isCreditSale?: boolean
  isCashSale?: boolean
  hasTrackingCode?: boolean
  page?: number
  pageSize?: number
  orderBy?: 'saleNumber' | 'saleDate' | 'totalAmount' | 'status' | 'createdAt'
  orderDirection?: 'ASC' | 'DESC'
  search?: string // Para busca em texto livre
}

// Interface para estatísticas de vendas
export interface SaleStatistics {
  totalSales: number
  totalAmount: number
  totalProfit: number
  averageTicket: number
  salesByStatus: Record<SaleStatus, number>
  salesByType: Record<SaleType, number>
  salesByPaymentType: Record<PaymentType, number>
  salesByMonth: Record<string, number>
  overdueSales: number
  pendingSales: number
  completedSales: number
}

// Interface para o repository de vendas
export default interface ISalesRepository {
  // Operations básicas
  create(sale: Sale): Promise<IResult<Sale>>
  findById(id: string): Promise<IResult<Sale>>
  findBySaleNumber(saleNumber: string): Promise<IResult<Sale>>
  findByCustomer(customerId: string): Promise<IResult<Sale[]>>
  findByCompany(companyId: string): Promise<IResult<Sale[]>>
  
  // Operations de listagem com filtros e paginação
  findWithFilters(filters: SaleFilters): Promise<IPaginationResult<Sale>>
  
  // Operations de atualização
  update(id: string, sale: Partial<Sale>): Promise<IResult<Sale>>
  
  // Operations de soft delete
  delete(id: string): Promise<IResult<void>>
  restore(id: string): Promise<IResult<void>>
  
  // Operations de listagem simplificadas
  findAllActive(): Promise<IResult<Sale[]>>
  findAll(page?: number, pageSize?: number): Promise<IPaginationResult<Sale>>
  
  // Operations de verificação
  existsBySaleNumber(saleNumber: string): Promise<boolean>
  
  // Operations específicas para vendas
  findByStatus(status: SaleStatus): Promise<IResult<Sale[]>>
  findBySaleType(saleType: SaleType): Promise<IResult<Sale[]>>
  findByPaymentType(paymentType: PaymentType): Promise<IResult<Sale[]>>
  findByDateRange(startDate: Date, endDate: Date): Promise<IResult<Sale[]>>
  findOverdueSales(): Promise<IResult<Sale[]>>
  findPendingSales(): Promise<IResult<Sale[]>>
  findCreditSales(): Promise<IResult<Sale[]>>
  findCashSales(): Promise<IResult<Sale[]>>
  findSalesWithDeliveryAddress(): Promise<IResult<Sale[]>>
  findSalesByCustomerSegment(personType: 'FISICA' | 'JURIDICA'): Promise<IResult<Sale[]>>
  
  // Operations de busca de texto
  searchSales(searchTerm: string): Promise<IResult<Sale[]>>
  
  // Operations de estatísticas
  getStatistics(startDate?: Date, endDate?: Date): Promise<IResult<SaleStatistics>>
  getSalesSummaryByStatus(): Promise<IResult<Record<SaleStatus, number>>>
  getSalesSummaryByType(): Promise<IResult<Record<SaleType, number>>>
  getSalesSummaryByPaymentType(): Promise<IResult<Record<PaymentType, number>>>
  getTopSellingProducts(limit?: number): Promise<IResult<any[]>>
  getSalesByMonth(year?: number): Promise<IResult<Record<string, number>>>
  
  // Operations para cálculo de KPIs
  getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number>
  getTotalProfit(startDate?: Date, endDate?: Date): Promise<number>
  getAverageTicketValue(startDate?: Date, endDate?: Date): Promise<number>
  getConversionRate(startDate?: Date, endDate?: Date): Promise<number>
  getCustomerLifetimeValue(customerId: string): Promise<number>
  getRepeatCustomerRate(startDate?: Date, endDate?: Date): Promise<number>
  
  // Operations para análise de performance
  getSalesPerformance(period: 'day' | 'week' | 'month' | 'year'): Promise<IResult<any[]>>
  getBestSellingCategories(limit?: number): Promise<IResult<any[]>>
  getSalesTrends(period: 'day' | 'week' | 'month'): Promise<IResult<any[]>>
  getSalesForecast(monthsAhead?: number): Promise<IResult<any[]>>
  
  // Operations para gerenciamento de estoque
  updateInventoryForSale(saleId: string, saleProducts: SaleProduct[]): Promise<IResult<void>>
  reserveInventory(saleId: string, productId: string, quantity: number): Promise<IResult<void>>
  releaseInventoryReservation(saleId: string, productId: string, quantity: number): Promise<IResult<void>>
  confirmInventorySale(saleId: string, productId: string, quantity: number): Promise<IResult<void>>
  
  // Operations para relacionamentos
  findSaleWithProducts(saleId: string): Promise<IResult<Sale>>
  findSaleWithCustomer(saleId: string): Promise<IResult<Sale>>
  findSaleWithDetails(saleId: string): Promise<IResult<Sale>>
  findSalesByProduct(productId: string): Promise<IResult<Sale[]>>
  
  // Operations para contagem
  count(): Promise<number>
  countActive(): Promise<number>
  countByStatus(status: SaleStatus): Promise<number>
  countBySaleType(saleType: SaleType): Promise<number>
  countByPaymentType(paymentType: PaymentType): Promise<number>
  countOverdue(): Promise<number>
  countPending(): Promise<number>
  countCompleted(): Promise<number>
  countByDateRange(startDate: Date, endDate: Date): Promise<number>
  
  // Operations para relatórios avançados
  generateSalesReport(filters: SaleFilters): Promise<IResult<any>>
  generateCustomerReport(customerId: string): Promise<IResult<any>>
  generateProductSalesReport(productId: string, startDate?: Date, endDate?: Date): Promise<IResult<any>>
  generateFinancialReport(startDate: Date, endDate: Date): Promise<IResult<any>>
  generateInventoryMovementReport(startDate: Date, endDate: Date): Promise<IResult<any>>
  
  // Operations para otimização
  bulkUpdateStatus(saleIds: string[], status: SaleStatus): Promise<IResult<void>>
  bulkUpdatePaymentStatus(saleIds: string[], paymentStatus: string): Promise<IResult<void>>
  cleanupOldDraftSales(daysOld?: number): Promise<IResult<number>>
  optimizeIndexes(): Promise<IResult<void>>
  
  // Operations para integridade de dados
  validateSaleIntegrity(saleId: string): Promise<IResult<boolean>>
  fixOrphanedSales(): Promise<IResult<number>>
  recalculateSaleTotals(saleId: string): Promise<IResult<Sale>>
  
  // Operations para auditoria
  getSaleHistory(saleId: string): Promise<IResult<any[]>>
  getAuditLog(startDate?: Date, endDate?: Date): Promise<IResult<any[]>>
  
  // Operations para configurações
  getSaleConfiguration(): Promise<IResult<any>>
  updateSaleConfiguration(config: any): Promise<IResult<void>>
}