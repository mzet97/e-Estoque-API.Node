import { DomainEvent, EventHandler, SaleCreatedEvent, SaleConfirmedEvent, SaleCancelledEvent } from '../../shared/events/DomainEvents'
import RedisClient from '@shared/redis/RedisClient'

// Inventory Event Handlers
export class UpdateStockOnSaleHandler implements EventHandler {
  constructor(
    private redis: RedisClient,
    private getInventoryForProduct: (productId: string) => Promise<{ currentStock: number }>,
    private updateInventoryStock: (productId: string, newStock: number, reason: string) => Promise<void>
  ) {}

  canHandle(eventType: string): boolean {
    return ['SaleCreated', 'SaleConfirmed', 'SaleCancelled'].includes(eventType)
  }

  getHandlerName(): string {
    return 'UpdateStockOnSaleHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    console.log(`📦 Handling ${event.eventType} for inventory update...`)

    if (event instanceof SaleCreatedEvent) {
      await this.handleSaleCreated(event)
    } else if (event instanceof SaleConfirmedEvent) {
      await this.handleSaleConfirmed(event)
    } else if (event instanceof SaleCancelledEvent) {
      await this.handleSaleCancelled(event)
    }
  }

  private async handleSaleCreated(event: SaleCreatedEvent): Promise<void> {
    // Reserve stock for the sale
    for (const item of event.data.items) {
      try {
        const inventory = await this.getInventoryForProduct(item.productId)
        const currentStock = inventory.currentStock

        // Reserve stock (subtract from available)
        const reservedStock = Math.max(0, currentStock - item.quantity)
        
        // Store reservation
        const reservationKey = `stock_reservation:${event.aggregateId}:${item.productId}`
        await this.redis.setex(reservationKey, 3600, JSON.stringify({
          quantity: item.quantity,
          reservedAt: new Date().toISOString(),
          saleId: event.aggregateId
        }))

        console.log(`📦 Reserved ${item.quantity} units of product ${item.productId} for sale ${event.aggregateId}`)
        
      } catch (error) {
        console.error(`❌ Failed to reserve stock for product ${item.productId}:`, error)
        throw error
      }
    }
  }

  private async handleSaleConfirmed(event: SaleConfirmedEvent): Promise<void> {
    // Finalize stock reservation - actually deduct from inventory
    const saleId = event.aggregateId
    
    // Get all reservations for this sale
    const reservationPattern = `stock_reservation:${saleId}:*`
    const reservationKeys = await this.redis.keys(reservationPattern)
    
    for (const reservationKey of reservationKeys) {
      try {
        const reservationData = JSON.parse(await this.redis.get(reservationKey) || '{}')
        const productId = reservationKey.split(':').pop()!
        const quantity = reservationData.quantity

        // Update actual inventory
        await this.updateInventoryStock(productId, quantity, `Sale confirmed: ${saleId}`)

        // Remove reservation
        await this.redis.del(reservationKey)
        
        console.log(`📦 Confirmed stock deduction for product ${productId} (qty: ${quantity})`)
        
      } catch (error) {
        console.error(`❌ Failed to confirm stock deduction:`, error)
        // Log the error but don't throw - the stock should be updated eventually
      }
    }
  }

  private async handleSaleCancelled(event: SaleCancelledEvent): Promise<void> {
    // Release reserved stock back to available inventory
    const saleId = event.aggregateId
    
    const reservationPattern = `stock_reservation:${saleId}:*`
    const reservationKeys = await this.redis.keys(reservationPattern)
    
    for (const reservationKey of reservationKeys) {
      try {
        const reservationData = JSON.parse(await this.redis.get(reservationKey) || '{}')
        const productId = reservationKey.split(':').pop()!
        const quantity = reservationData.quantity

        // Release the reservation
        await this.redis.del(reservationKey)
        
        console.log(`📦 Released reservation for product ${productId} (qty: ${quantity}) due to sale cancellation`)
        
      } catch (error) {
        console.error(`❌ Failed to release stock reservation:`, error)
      }
    }
  }
}

// Low Stock Alert Handler
export class LowStockAlertHandler implements EventHandler {
  constructor(
    private redis: RedisClient,
    private getProductInfo: (productId: string) => Promise<{ name: string, minimumStock: number }>,
    private sendNotification: (alert: any) => Promise<void>
  ) {}

  canHandle(eventType: string): boolean {
    return eventType === 'StockMovement'
  }

  getHandlerName(): string {
    return 'LowStockAlertHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.data.currentQuantity <= event.data.minimumStock) {
      try {
        const productInfo = await this.getProductInfo(event.aggregateId)
        
        const alert = {
          productId: event.aggregateId,
          productName: productInfo.name,
          currentQuantity: event.data.currentQuantity,
          minimumStock: event.data.minimumStock,
          companyId: event.data.companyId,
          alertType: 'LOW_STOCK',
          severity: event.data.currentQuantity === 0 ? 'CRITICAL' : 'WARNING',
          timestamp: new Date().toISOString()
        }

        // Cache recent alerts to avoid spam
        const alertKey = `stock_alert:${event.aggregateId}:${Date.now()}`
        const alertExists = await this.redis.get(`recent_alert:${event.aggregateId}`)
        
        if (!alertExists) {
          await this.sendNotification(alert)
          await this.redis.setex(`recent_alert:${event.aggregateId}`, 300, '1') // 5 min cooldown
        }

        console.log(`⚠️ Low stock alert generated for product ${productInfo.name}`)
        
      } catch (error) {
        console.error('❌ Failed to process low stock alert:', error)
      }
    }
  }
}

// Inventory Analytics Handler
export class InventoryAnalyticsHandler implements EventHandler {
  constructor(private redis: RedisClient) {}

  canHandle(eventType: string): boolean {
    return ['StockMovement', 'ProductCreated', 'ProductDeleted'].includes(eventType)
  }

  getHandlerName(): string {
    return 'InventoryAnalyticsHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      const timestamp = event.occurredAt.toISOString().slice(0, 10) // YYYY-MM-DD
      const hour = event.occurredAt.getHours()
      
      if (event.eventType === 'StockMovement') {
        // Track movement statistics
        const movementKey = `inventory:movements:${timestamp}`
        await this.redis.hincrby(`${movementKey}:count`, 'total', 1)
        await this.redis.hincrby(`${movementKey}:count`, event.data.movementType, 1)
        await this.redis.expire(movementKey, 30 * 24 * 3600) // 30 days

        // Track hourly movements
        const hourlyKey = `inventory:movements:hourly:${timestamp}`
        await this.redis.hincrby(`${hourlyKey}`, hour.toString(), 1)
        await this.redis.expire(hourlyKey, 30 * 24 * 3600)

        // Update product-specific stats
        const productKey = `inventory:product:${event.aggregateId}:${timestamp}`
        await this.redis.hincrby(`${productKey}:movements`, event.data.movementType, 1)
        await this.redis.expire(productKey, 90 * 24 * 3600) // 90 days
        
      } else if (event.eventType === 'ProductCreated') {
        // Track product creation
        const productKey = `inventory:products:created`
        await this.redis.hincrby(productKey, event.data.companyId, 1)
        
      } else if (event.eventType === 'ProductDeleted') {
        // Track product deletion
        const productKey = `inventory:products:deleted`
        await this.redis.hincrby(productKey, event.metadata.companyId || 'unknown', 1)
      }
      
      console.log(`📊 Updated inventory analytics for ${event.eventType}`)
      
    } catch (error) {
      console.error('❌ Failed to update inventory analytics:', error)
    }
  }
}

// Cache Invalidation Handler
export class InventoryCacheInvalidationHandler implements EventHandler {
  constructor(private redis: RedisClient) {}

  canHandle(eventType: string): boolean {
    return ['ProductCreated', 'ProductUpdated', 'ProductDeleted', 'StockMovement'].includes(eventType)
  }

  getHandlerName(): string {
    return 'InventoryCacheInvalidationHandler'
  }

  async handle(event: DomainEvent): Promise<void> {
    try {
      // Invalidate product cache
      const productCacheKeys = [
        `product:${event.aggregateId}`,
        `products:company:${event.metadata.companyId}`,
        `inventory:product:${event.aggregateId}`,
        `stock:product:${event.aggregateId}`
      ]

      for (const key of productCacheKeys) {
        const exists = await this.redis.exists(key)
        if (exists) {
          await this.redis.del(key)
        }
      }

      // Invalidate listing caches
      const listKeys = [
        `products:list:*`,
        `inventory:low-stock:*`,
        `products:category:${event.data.categoryId || '*'}`
      ]

      for (const pattern of listKeys) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      console.log(`🔄 Invalidated cache for product ${event.aggregateId}`)
      
    } catch (error) {
      console.error('❌ Failed to invalidate inventory cache:', error)
    }
  }
}