import { DomainEvent, EventHandler, SaleCreatedEvent, SaleConfirmedEvent, SaleCancelledEvent, CustomerCreatedEvent } from '../../shared/events/DomainEvents'
import RedisClient from '@shared/redis/RedisClient'

// Sales Analytics Handler
export class SalesAnalyticsHandler implements EventHandler {
  constructor(private redis: RedisClient) {}

  canHandle(eventType: string): boolean {
    return ['SaleCreated', 'SaleConfirmed', 'SaleCancelled'].includes(eventType)
  }

  getHandlerName(): string {
    return 'SalesAnalyticsHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      const timestamp = event.occurredAt.toISOString().slice(0, 10) // YYYY-MM-DD
      const hour = event.occurredAt.getHours()
      
      if (event instanceof SaleCreatedEvent) {
        await this.trackSaleCreated(event, timestamp, hour)
      } else if (event instanceof SaleConfirmedEvent) {
        await this.trackSaleConfirmed(event, timestamp, hour)
      } else if (event instanceof SaleCancelledEvent) {
        await this.trackSaleCancelled(event, timestamp, hour)
      }
      
    } catch (error) {
      console.error('❌ Failed to update sales analytics:', error)
    }
  }

  private async trackSaleCreated(event: SaleCreatedEvent, timestamp: string, hour: number): Promise<void> {
    const saleKey = `sales:created:${timestamp}`
    const hourlyKey = `sales:created:hourly:${timestamp}`
    const companyKey = `sales:company:${event.metadata.companyId}:${timestamp}`
    const customerKey = `sales:customer:${event.data.customerId}:${timestamp}`
    
    // Daily sales count
    await this.redis.hincrby(`${saleKey}:count`, 'total', 1)
    await this.redis.hincrbyfloat(`${saleKey}:revenue`, 'total', event.data.total)
    await this.redis.hincrby(`${saleKey}:items`, 'total', event.data.items.length)
    
    // Hourly distribution
    await this.redis.hincrby(hourlyKey, hour.toString(), 1)
    
    // Per company stats
    await this.redis.hincrby(`${companyKey}:count`, 'total', 1)
    await this.redis.hincrbyfloat(`${companyKey}:revenue`, 'total', event.data.total)
    
    // Customer purchase frequency
    await this.redis.hincrby(`${customerKey}:count`, 'total', 1)
    await this.redis.hincrbyfloat(`${customerKey}:revenue`, 'total', event.data.total)
    
    // Product performance
    for (const item of event.data.items) {
      const productKey = `sales:product:${item.productId}:${timestamp}`
      await this.redis.hincrby(`${productKey}:quantity`, 'sold', item.quantity)
      await this.redis.hincrbyfloat(`${productKey}:revenue`, 'total', item.quantity * item.unitPrice)
    }

    // Set expiration (30 days for daily, 7 days for hourly)
    await this.redis.expire(saleKey, 30 * 24 * 3600)
    await this.redis.expire(hourlyKey, 7 * 24 * 3600)
    await this.redis.expire(companyKey, 30 * 24 * 3600)
    await this.redis.expire(customerKey, 90 * 24 * 3600)
    
    console.log(`📊 Tracked sale creation: $${event.data.total} for company ${event.metadata.companyId}`)
  }

  private async trackSaleConfirmed(event: SaleConfirmedEvent, timestamp: string, hour: number): Promise<void> {
    const confirmedKey = `sales:confirmed:${timestamp}`
    const hourlyKey = `sales:confirmed:hourly:${timestamp}`
    
    await this.redis.hincrby(`${confirmedKey}:count`, 'total', 1)
    await this.redis.hincrby(hourlyKey, hour.toString(), 1)
    await this.redis.expire(confirmedKey, 30 * 24 * 3600)
    await this.redis.expire(hourlyKey, 7 * 24 * 3600)
    
    // Store sale confirmation in user's recent activity
    const userActivityKey = `user:${event.metadata.userId}:activity`
    await this.redis.lpush(userActivityKey, JSON.stringify({
      type: 'sale_confirmed',
      saleId: event.aggregateId,
      timestamp: event.occurredAt.toISOString(),
      paymentMethod: event.data.paymentMethod
    }))
    
    // Trim activity list to last 100 items
    await this.redis.ltrim(userActivityKey, 0, 99)
    await this.redis.expire(userActivityKey, 7 * 24 * 3600)
    
    console.log(`✅ Tracked sale confirmation: ${event.aggregateId}`)
  }

  private async trackSaleCancelled(event: SaleCancelledEvent, timestamp: string, hour: number): Promise<void> {
    const cancelledKey = `sales:cancelled:${timestamp}`
    
    await this.redis.hincrby(`${cancelledKey}:count`, 'total', 1)
    await this.redis.hincrby(`${cancelledKey}:reasons`, event.data.reason, 1)
    await this.redis.expire(cancelledKey, 30 * 24 * 3600)
    
    // Track cancellation reasons for analysis
    const reasonAnalysisKey = `sales:cancellation_analysis:${timestamp}`
    await this.redis.hincrby(reasonAnalysisKey, event.data.reason, 1)
    await this.redis.expire(reasonAnalysisKey, 90 * 24 * 3600)
    
    console.log(`❌ Tracked sale cancellation: ${event.aggregateId} - ${event.data.reason}`)
  }
}

// Customer Analytics Handler
export class CustomerAnalyticsHandler implements EventHandler {
  constructor(private redis: RedisClient) {}

  canHandle(eventType: string): boolean {
    return ['CustomerCreated', 'UserRegistered', 'SaleCreated', 'SaleConfirmed'].includes(eventType)
  }

  getHandlerName(): string {
    return 'CustomerAnalyticsHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      const timestamp = event.occurredAt.toISOString().slice(0, 10)
      
      if (event instanceof CustomerCreatedEvent || event.eventType === 'UserRegistered') {
        await this.trackCustomerRegistration(event, timestamp)
      } else if (event instanceof SaleCreatedEvent || event.eventType === 'SaleConfirmed') {
        await this.trackCustomerPurchases(event, timestamp)
      }
      
    } catch (error) {
      console.error('❌ Failed to update customer analytics:', error)
    }
  }

  private async trackCustomerRegistration(event: DomainEvent, timestamp: string): Promise<void> {
    const customerId = event.aggregateId
    const companyId = event.data.companyId || 'unknown'
    
    // Daily registrations
    const regKey = `customers:registered:${timestamp}`
    await this.redis.hincrby(`${regKey}:count`, 'total', 1)
    await this.redis.hincrby(`${regKey}:company`, companyId, 1)
    await this.redis.expire(regKey, 365 * 24 * 3600) // 1 year
    
    // Customer profile
    const customerKey = `customer:${customerId}:profile`
    await this.redis.hset(customerKey, {
      registered_at: event.occurredAt.toISOString(),
      email: event.data.email || event.data.email,
      company_id: companyId,
      first_purchase: 'pending'
    })
    await this.redis.expire(customerKey, 365 * 24 * 3600)
    
    console.log(`👤 Tracked customer registration: ${customerId}`)
  }

  private async trackCustomerPurchases(event: DomainEvent, timestamp: string): Promise<void> {
    const customerId = event.data.customerId || event.aggregateId
    const customerKey = `customer:${customerId}:profile`
    
    // Update customer purchase stats
    const isConfirmed = event instanceof SaleConfirmedEvent || event.eventType === 'SaleConfirmed'
    const revenue = event.data.total || 0
    const orderCount = isConfirmed ? 1 : 0
    
    // Update purchase metrics
    await this.redis.hincrby(`${customerKey}:stats`, 'total_orders', orderCount)
    await this.redis.hincrbyfloat(`${customerKey}:stats`, 'total_revenue', revenue)
    
    // Update first purchase date
    const existingFirstPurchase = await this.redis.hget(customerKey, 'first_purchase')
    if (existingFirstPurchase === 'pending' && isConfirmed) {
      await this.redis.hset(customerKey, 'first_purchase', timestamp)
    }
    
    // Update last purchase date
    await this.redis.hset(customerKey, 'last_purchase', timestamp)
    
    // Customer segmentation (RFM analysis)
    await this.updateCustomerSegmentation(customerId, customerKey)
    
    console.log(`🛒 Tracked customer purchase: ${customerId} - $${revenue}`)
  }

  private async updateCustomerSegmentation(customerId: string, customerKey: string): Promise<void> {
    const stats = await this.redis.hgetall(`${customerKey}:stats`)
    const totalOrders = parseInt(stats.total_orders || '0')
    const totalRevenue = parseFloat(stats.total_revenue || '0')
    
    let segment = 'NEW'
    if (totalOrders >= 10 && totalRevenue >= 1000) {
      segment = 'VIP'
    } else if (totalOrders >= 5 && totalRevenue >= 500) {
      segment = 'LOYAL'
    } else if (totalOrders >= 3 || totalRevenue >= 200) {
      segment = 'REGULAR'
    } else if (totalOrders >= 1) {
      segment = 'ACTIVE'
    }
    
    await this.redis.hset(customerKey, 'segment', segment)
    
    console.log(`🎯 Updated customer segment for ${customerId}: ${segment}`)
  }
}

// Email Notification Handler
export class EmailNotificationHandler implements EventHandler {
  constructor(
    private redis: RedisClient,
    private sendEmail: (emailData: any) => Promise<void>
  ) {}

  canHandle(eventType: string): boolean {
    return ['SaleCreated', 'SaleConfirmed', 'SaleCancelled', 'CustomerCreated', 'UserActivated'].includes(eventType)
  }

  getHandlerName(): string {
    return 'EmailNotificationHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      const emailData = await this.buildEmailData(event)
      if (emailData) {
        await this.sendEmail(emailData)
        
        // Track email sent
        const emailKey = `email:sent:${event.occurredAt.toISOString().slice(0, 10)}`
        await this.redis.hincrby(emailKey, emailData.template, 1)
        await this.redis.expire(emailKey, 30 * 24 * 3600)
        
        console.log(`📧 Sent email: ${emailData.template} to ${emailData.to}`)
      }
    } catch (error) {
      console.error('❌ Failed to send email notification:', error)
    }
  }

  private async buildEmailData(event: DomainEvent): Promise<any | null> {
    switch (event.eventType) {
      case 'SaleCreated':
        return {
          to: event.metadata.customerEmail,
          template: 'sale_confirmation_pending',
          subject: `Pedido #${event.data.saleNumber} recebido`,
          data: {
            saleNumber: event.data.saleNumber,
            total: event.data.total,
            items: event.data.items,
            customerName: event.metadata.customerName
          }
        }
        
      case 'SaleConfirmed':
        return {
          to: event.metadata.customerEmail,
          template: 'sale_confirmed',
          subject: `Pedido #${event.aggregateId} confirmado`,
          data: {
            saleId: event.aggregateId,
            paymentMethod: event.data.paymentMethod,
            customerName: event.metadata.customerName
          }
        }
        
      case 'SaleCancelled':
        return {
          to: event.metadata.customerEmail,
          template: 'sale_cancelled',
          subject: `Pedido #${event.aggregateId} cancelado`,
          data: {
            saleId: event.aggregateId,
            reason: event.data.reason,
            customerName: event.metadata.customerName
          }
        }
        
      case 'CustomerCreated':
        return {
          to: event.data.email,
          template: 'welcome',
          subject: 'Bem-vindo ao e-Estoque!',
          data: {
            name: event.data.name,
            email: event.data.email
          }
        }
        
      case 'UserActivated':
        return {
          to: event.data.email,
          template: 'account_activated',
          subject: 'Sua conta foi ativada!',
          data: {
            name: event.metadata.userName,
            email: event.data.email
          }
        }
        
      default:
        return null
    }
  }
}

// Cache Invalidation Handler for Sales
export class SalesCacheInvalidationHandler implements EventHandler {
  constructor(private redis: RedisClient) {}

  canHandle(eventType: string): boolean {
    return ['SaleCreated', 'SaleConfirmed', 'SaleCancelled'].includes(eventType)
  }

  getHandlerName(): string {
    return 'SalesCacheInvalidationHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      // Invalidate sales cache
      const cacheKeys = [
        `sales:customer:${event.data.customerId}`,
        `sales:company:${event.metadata.companyId}`,
        `sales:${event.occurredAt.toISOString().slice(0, 10)}`,
        `analytics:sales:daily:${event.occurredAt.toISOString().slice(0, 10)}`
      ]

      for (const key of cacheKeys) {
        const exists = await this.redis.exists(key)
        if (exists) {
          await this.redis.del(key)
        }
      }

      // Invalidate dashboard caches
      const dashboardPatterns = [
        `dashboard:sales:*`,
        `reports:sales:*`,
        `analytics:sales:*`
      ]

      for (const pattern of dashboardPatterns) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      console.log(`🔄 Invalidated sales cache for sale ${event.aggregateId}`)
      
    } catch (error) {
      console.error('❌ Failed to invalidate sales cache:', error)
    }
  }
}