import { v4 as uuidv4 } from 'uuid'

export abstract class DomainEvent {
  public readonly id: string
  public readonly occurredAt: Date
  public readonly version: string = '1.0'
  
  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly data: Record<string, any> = {},
    public readonly metadata: Record<string, any> = {}
  ) {
    this.id = uuidv4()
    this.occurredAt = new Date()
  }

  toJSON(): any {
    return {
      id: this.id,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      data: this.data,
      metadata: {
        version: this.version,
        occurredAt: this.occurredAt.toISOString(),
        ...this.metadata
      }
    }
  }

  static fromJSON(json: any): DomainEvent {
    const eventClass = EventRegistry.getEventClass(json.eventType)
    return new eventClass(json.aggregateId, json.data, json.metadata)
  }
}

// Event Registry for dynamic event creation
class EventRegistry {
  private static eventClasses: Map<string, new (...args: any[]) => DomainEvent> = new Map()

  static register(eventType: string, eventClass: new (...args: any[]) => DomainEvent): void {
    this.eventClasses.set(eventType, eventClass)
  }

  static getEventClass(eventType: string): new (...args: any[]) => DomainEvent {
    const eventClass = this.eventClasses.get(eventType)
    if (!eventClass) {
      throw new Error(`Event class not registered for type: ${eventType}`)
    }
    return eventClass
  }

  static isRegistered(eventType: string): boolean {
    return this.eventClasses.has(eventType)
  }
}

// Customer Events
export class CustomerCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name: string
      email: string
      document: string
      phone: string
      companyId: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('CustomerCreated', aggregateId, 'Customer', data, metadata)
  }
}

export class CustomerUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name?: string
      email?: string
      document?: string
      phone?: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('CustomerUpdated', aggregateId, 'Customer', data, metadata)
  }
}

export class CustomerDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: { reason?: string },
    metadata: Record<string, any> = {}
  ) {
    super('CustomerDeleted', aggregateId, 'Customer', data, metadata)
  }
}

// Product Events
export class ProductCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name: string
      description: string
      price: number
      categoryId: string
      companyId: string
      image?: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('ProductCreated', aggregateId, 'Product', data, metadata)
  }
}

export class ProductUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name?: string
      description?: string
      price?: number
      categoryId?: string
      image?: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('ProductUpdated', aggregateId, 'Product', data, metadata)
  }
}

export class ProductDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: { reason?: string },
    metadata: Record<string, any> = {}
  ) {
    super('ProductDeleted', aggregateId, 'Product', data, metadata)
  }
}

// Sales Events
export class SaleCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      saleNumber: string
      customerId: string
      items: Array<{
        productId: string
        quantity: number
        unitPrice: number
      }>
      total: number
      status: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('SaleCreated', aggregateId, 'Sale', data, metadata)
  }
}

export class SaleConfirmedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      paymentMethod: string
      confirmationTime: Date
    },
    metadata: Record<string, any> = {}
  ) {
    super('SaleConfirmed', aggregateId, 'Sale', data, metadata)
  }
}

export class SaleCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      reason: string
      cancelledBy: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('SaleCancelled', aggregateId, 'Sale', data, metadata)
  }
}

// Inventory Events
export class StockMovementEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      productId: string
      movementType: 'IN' | 'OUT'
      quantity: number
      previousQuantity: number
      currentQuantity: number
      reason: string
      reference?: string
      userId: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('StockMovement', aggregateId, 'Inventory', data, metadata)
  }
}

export class LowStockAlertEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      productId: string
      productName: string
      currentQuantity: number
      minimumStock: number
      companyId: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('LowStockAlert', aggregateId, 'Inventory', data, metadata)
  }
}

// Company Events
export class CompanyCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name: string
      document: string
      email: string
      phoneNumber: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('CompanyCreated', aggregateId, 'Company', data, metadata)
  }
}

export class CompanyUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      name?: string
      email?: string
      phoneNumber?: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('CompanyUpdated', aggregateId, 'Company', data, metadata)
  }
}

// Auth Events
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      email: string
      firstName: string
      lastName: string
      companyId?: string
      role: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('UserRegistered', aggregateId, 'User', data, metadata)
  }
}

export class UserActivatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      email: string
      activatedBy: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('UserActivated', aggregateId, 'User', data, metadata)
  }
}

// Email Events
export class EmailSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: {
      to: string
      subject: string
      template: string
      status: 'SENT' | 'FAILED' | 'BOUNCED'
      errorMessage?: string
    },
    metadata: Record<string, any> = {}
  ) {
    super('EmailSent', aggregateId, 'Email', data, metadata)
  }
}

// Register all events
EventRegistry.register('CustomerCreated', CustomerCreatedEvent)
EventRegistry.register('CustomerUpdated', CustomerUpdatedEvent)
EventRegistry.register('CustomerDeleted', CustomerDeletedEvent)
EventRegistry.register('ProductCreated', ProductCreatedEvent)
EventRegistry.register('ProductUpdated', ProductUpdatedEvent)
EventRegistry.register('ProductDeleted', ProductDeletedEvent)
EventRegistry.register('SaleCreated', SaleCreatedEvent)
EventRegistry.register('SaleConfirmed', SaleConfirmedEvent)
EventRegistry.register('SaleCancelled', SaleCancelledEvent)
EventRegistry.register('StockMovement', StockMovementEvent)
EventRegistry.register('LowStockAlert', LowStockAlertEvent)
EventRegistry.register('CompanyCreated', CompanyCreatedEvent)
EventRegistry.register('CompanyUpdated', CompanyUpdatedEvent)
EventRegistry.register('UserRegistered', UserRegisteredEvent)
EventRegistry.register('UserActivated', UserActivatedEvent)
EventRegistry.register('EmailSent', EmailSentEvent)

// Event Store Interface
export interface IEventStore {
  saveEvent(event: DomainEvent): Promise<void>
  getEvents(aggregateId: string): Promise<DomainEvent[]>
  getEventsByType(eventType: string, since?: Date): Promise<DomainEvent[]>
  getAllEvents(since?: Date): Promise<DomainEvent[]>
}

// In-memory Event Store for development
export class InMemoryEventStore implements IEventStore {
  private events: Map<string, DomainEvent[]> = new Map()

  async saveEvent(event: DomainEvent): Promise<void> {
    const aggregateEvents = this.events.get(event.aggregateId) || []
    aggregateEvents.push(event)
    this.events.set(event.aggregateId, aggregateEvents)
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || []
  }

  async getEventsByType(eventType: string, since?: Date): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = []
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => 
        event.eventType === eventType && 
        (!since || event.occurredAt >= since)
      ))
    }
    return allEvents.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
  }

  async getAllEvents(since?: Date): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = []
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => !since || event.occurredAt >= since))
    }
    return allEvents.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
  }
}

export { EventRegistry }