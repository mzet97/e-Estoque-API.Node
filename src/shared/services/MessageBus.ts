import RabbitMQService from './RabbitMQService'
import { DomainEvent, EventStore, InMemoryEventStore } from '../events/DomainEvents'
import RedisClient from '@shared/redis/RedisClient'
import { EventEmitter } from 'events'

export interface MessageBusConfig {
  rabbitMQ: {
    host: string
    port: number
    username: string
    password: string
    vhost?: string
  }
  exchanges: {
    [exchangeName: string]: {
      type: 'topic' | 'direct' | 'fanout' | 'headers'
      durable?: boolean
    }
  }
  queues: {
    [queueName: string]: {
      durable?: boolean
      exclusive?: boolean
      autoDelete?: boolean
      deadLetterExchange?: string
      deadLetterRoutingKey?: string
    }
  }
  routingKeys: {
    [eventType: string]: string
  }
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void> | void
  canHandle(eventType: string): boolean
  getHandlerName(): string
}

class MessageBus extends EventEmitter {
  private rabbitMQ: RabbitMQService
  private eventStore: EventStore
  private redis: RedisClient
  private config: MessageBusConfig
  private handlers: Map<string, EventHandler[]> = new Map()
  private isInitialized = false

  constructor(
    config: MessageBusConfig,
    eventStore?: EventStore,
    rabbitMQ?: RabbitMQService,
    redis?: RedisClient
  ) {
    super()
    this.config = config
    this.eventStore = eventStore || new InMemoryEventStore()
    this.rabbitMQ = rabbitMQ || new RabbitMQService(config.rabbitMQ)
    this.redis = redis || RedisClient.getInstance()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      console.log('🚌 Initializing Message Bus...')
      
      // Connect to RabbitMQ
      await this.rabbitMQ.connect()
      
      // Set up event handlers
      await this.setupEventHandlers()
      
      this.isInitialized = true
      console.log('✅ Message Bus initialized successfully')
      
      this.emit('initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Message Bus:', error)
      throw error
    }
  }

  private async setupEventHandlers(): Promise<void> {
    // Set up exchanges
    for (const [exchangeName, exchangeConfig] of Object.entries(this.config.exchanges)) {
      await this.rabbitMQ.declareExchange(exchangeName, {
        type: exchangeConfig.type,
        durable: exchangeConfig.durable ?? true
      })
    }

    // Set up queues
    for (const [queueName, queueConfig] of Object.entries(this.config.queues)) {
      await this.rabbitMQ.declareQueue(queueName, {
        durable: queueConfig.durable ?? true,
        exclusive: queueConfig.exclusive ?? false,
        autoDelete: queueConfig.autoDelete ?? false,
        deadLetterExchange: queueConfig.deadLetterExchange,
        deadLetterRoutingKey: queueConfig.deadLetterRoutingKey
      })
    }

    // Bind event-specific queues
    await this.setupEventQueues()
  }

  private async setupEventQueues(): Promise<void> {
    const eventTypes = Object.keys(this.config.routingKeys)
    
    for (const eventType of eventTypes) {
      const queueName = `events.${eventType.toLowerCase()}`
      const exchangeName = 'domain.events'
      const routingKey = this.config.routingKeys[eventType]
      
      // Ensure queue exists
      if (!this.config.queues[queueName]) {
        await this.rabbitMQ.declareQueue(queueName, {
          durable: true,
          deadLetterExchange: 'events.dlx',
          deadLetterRoutingKey: `dlq.${eventType.toLowerCase()}`
        })
      }
      
      // Bind queue to exchange
      await this.rabbitMQ.bindQueue(queueName, exchangeName, routingKey)
    }

    // Set up dead letter queue
    await this.rabbitMQ.declareExchange('events.dlx', { type: 'direct', durable: true })
    await this.rabbitMQ.declareQueue('events.dlq', { durable: true })
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.ensureInitialized()
    
    try {
      // Save event to store
      await this.eventStore.saveEvent(event)
      
      // Publish to RabbitMQ
      const exchangeName = 'domain.events'
      const routingKey = this.config.routingKeys[event.eventType] || `events.${event.eventType.toLowerCase()}`
      
      const options = {
        persistent: true,
        messageId: event.id,
        correlationId: event.aggregateId,
        type: event.eventType,
        contentType: 'application/json',
        headers: {
          'event-type': event.eventType,
          'aggregate-type': event.aggregateType,
          'aggregate-id': event.aggregateId,
          'timestamp': event.occurredAt.toISOString(),
          'version': event.version
        }
      }
      
      await this.rabbitMQ.publish(exchangeName, routingKey, event.toJSON(), options)
      
      // Cache event for quick access
      await this.cacheEvent(event)
      
      console.log(`📤 Published event: ${event.eventType} (${event.id})`)
      this.emit('eventPublished', event)
      
    } catch (error) {
      console.error(`❌ Failed to publish event ${event.eventType}:`, error)
      this.emit('eventPublishFailed', event, error)
      throw error
    }
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    
    this.handlers.get(eventType)!.push(handler)
    
    // Start consuming if not already consuming for this event type
    await this.startEventConsumer(eventType)
    
    console.log(`📥 Subscribed handler for event: ${eventType}`)
  }

  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
        if (handlers.length === 0) {
          this.handlers.delete(eventType)
          await this.stopEventConsumer(eventType)
        }
      }
    }
  }

  private async startEventConsumer(eventType: string): Promise<void> {
    const queueName = `events.${eventType.toLowerCase()}`
    const handlers = this.handlers.get(eventType) || []
    
    if (handlers.length === 0) {
      return
    }
    
    await this.rabbitMQ.consume(queueName, async (message: any, metadata: any) => {
      try {
        const event = DomainEvent.fromJSON(message)
        
        // Process event with all registered handlers
        for (const handler of handlers) {
          if (handler.canHandle(event.eventType)) {
            try {
              await handler.handle(event)
              console.log(`🔄 Processed event ${event.eventType} with handler ${handler.getHandlerName()}`)
            } catch (error) {
              console.error(`❌ Handler ${handler.getHandlerName()} failed for event ${event.eventType}:`, error)
              this.emit('handlerFailed', handler, event, error)
            }
          }
        }
        
        this.emit('eventProcessed', event)
        
      } catch (error) {
        console.error(`❌ Failed to process message for event type ${eventType}:`, error)
        this.emit('messageProcessingFailed', message, error)
      }
    }, {
      consumerTag: `handler_${eventType.toLowerCase()}_${Date.now()}`
    }, `consumer_${eventType.toLowerCase()}`)
  }

  private async stopEventConsumer(eventType: string): Promise<void> {
    // This would require tracking consumer tags - simplified for now
    console.log(`🛑 Stopping consumer for event type: ${eventType}`)
  }

  private async cacheEvent(event: DomainEvent): Promise<void> {
    try {
      const key = `event:${event.aggregateId}:${event.id}`
      await this.redis.setex(key, 3600, JSON.stringify(event.toJSON())) // 1 hour cache
    } catch (error) {
      console.warn('⚠️ Failed to cache event:', error)
    }
  }

  async replayEvents(aggregateId: string, fromEventId?: string): Promise<DomainEvent[]> {
    const events = await this.eventStore.getEvents(aggregateId)
    
    if (fromEventId) {
      const fromIndex = events.findIndex(e => e.id === fromEventId)
      if (fromIndex > -1) {
        return events.slice(fromIndex + 1)
      }
    }
    
    return events
  }

  async getEventHistory(aggregateId: string): Promise<DomainEvent[]> {
    return await this.eventStore.getEvents(aggregateId)
  }

  async getEventsByType(eventType: string, since?: Date): Promise<DomainEvent[]> {
    return await this.eventStore.getEventsByType(eventType, since)
  }

  async isHealthy(): Promise<boolean> {
    try {
      const rabbitMQHealthy = await this.rabbitMQ.isHealthy()
      const redisHealthy = await this.redis.isHealthy()
      
      return rabbitMQHealthy && redisHealthy
    } catch (error) {
      return false
    }
  }

  async getStats(): Promise<any> {
    const rabbitMQInfo = await this.rabbitMQ.getConnectionInfo()
    const redisHealth = await this.redis.health()
    
    return {
      rabbitMQ: rabbitMQInfo,
      redis: redisHealth,
      handlers: Array.from(this.handlers.keys()),
      initialized: this.isInitialized
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Message Bus...')
    
    try {
      await this.rabbitMQ.disconnect()
      await this.redis.disconnect()
      this.isInitialized = false
      
      this.emit('shutdown')
      console.log('✅ Message Bus shut down successfully')
    } catch (error) {
      console.error('❌ Error during Message Bus shutdown:', error)
      throw error
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

export default MessageBus