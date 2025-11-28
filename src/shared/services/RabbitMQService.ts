import { Connection, Channel, ConsumeMessage } from 'amqplib'
import { EventEmitter } from 'events'

export interface RabbitMQConfig {
  host: string
  port: number
  username: string
  password: string
  vhost?: string
  heartbeat?: number
  reconnectTimeInMs?: number
  maxReconnectAttempts?: number
}

export interface MessageOptions {
  persistent?: boolean
  expiration?: string
  priority?: number
  messageId?: string
  correlationId?: string
  replyTo?: string
  type?: string
  contentType?: string
  contentEncoding?: string
  headers?: Record<string, any>
}

export interface QueueConfig {
  durable?: boolean
  exclusive?: boolean
  autoDelete?: boolean
  arguments?: Record<string, any>
  deadLetterExchange?: string
  deadLetterRoutingKey?: string
  messageTTL?: number
  maxPriority?: number
  maxLength?: number
  maxLengthBytes?: number
}

export interface ExchangeConfig {
  type: 'topic' | 'direct' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
  arguments?: Record<string, any>
}

export interface ConsumeOptions {
  consumerTag?: string
  noLocal?: boolean
  noAck?: boolean
  exclusive?: boolean
  priority?: number
  arguments?: Record<string, any>
}

class RabbitMQService extends EventEmitter {
  private connection: Connection | null = null
  private channels: Map<string, Channel> = new Map()
  private config: RabbitMQConfig
  private reconnectAttempts = 0
  private isConnecting = false
  private consumers: Map<string, any> = new Map()

  constructor(config: RabbitMQConfig) {
    super()
    this.config = {
      vhost: '/',
      heartbeat: 60,
      reconnectTimeInMs: 5000,
      maxReconnectAttempts: 10,
      ...config
    }
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.connection) {
      return
    }

    this.isConnecting = true
    try {
      const connectionString = this.buildConnectionString()
      console.log(`🔗 Connecting to RabbitMQ: ${connectionString}`)
      
      this.connection = await this.connectToRabbitMQ(connectionString)
      
      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error)
        this.emit('connectionError', error)
        this.handleConnectionError(error)
      })

      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed')
        this.emit('connectionClosed')
        this.handleConnectionClose()
      })

      this.connection.on('blocked', (reason) => {
        console.warn('RabbitMQ connection blocked:', reason)
        this.emit('connectionBlocked', reason)
      })

      this.connection.on('unblocked', () => {
        console.log('RabbitMQ connection unblocked')
        this.emit('connectionUnblocked')
      })

      this.reconnectAttempts = 0
      console.log('✅ Connected to RabbitMQ successfully')
      this.emit('connected')
      
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error)
      this.isConnecting = false
      throw error
    }
  }

  private buildConnectionString(): string {
    const { host, port, username, password, vhost } = this.config
    const credentials = username && password ? `${username}:${password}@` : ''
    const vhostPart = vhost && vhost !== '/' ? `/${vhost}` : ''
    return `amqp://${credentials}${host}:${port}${vhostPart}`
  }

  private async connectToRabbitMQ(connectionString: string): Promise<Connection> {
    const connection = await require('amqplib').connect(connectionString, {
      heartbeat: this.config.heartbeat,
      reconnectTimeInMs: this.config.reconnectTimeInMs
    })
    
    return connection
  }

  private async handleConnectionError(error: Error): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnect attempts reached, giving up')
      this.emit('maxReconnectAttemptsReached', error)
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`)
    
    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }, this.config.reconnectTimeInMs)
  }

  private async handleConnectionClose(): Promise<void> {
    console.log('🔄 Connection closed, will attempt to reconnect...')
    this.connection = null
    this.channels.clear()
    
    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }, this.config.reconnectTimeInMs)
  }

  async disconnect(): Promise<void> {
    try {
      // Close all channels
      for (const [name, channel] of this.channels) {
        await channel.close()
        console.log(`🔌 Channel ${name} closed`)
      }
      this.channels.clear()

      // Cancel all consumers
      for (const [tag, consumer] of this.consumers) {
        await consumer.channel.cancel(tag)
        console.log(`👤 Consumer ${tag} cancelled`)
      }
      this.consumers.clear()

      // Close connection
      if (this.connection) {
        await this.connection.close()
        console.log('🔌 RabbitMQ connection closed')
        this.connection = null
      }

      this.emit('disconnected')
    } catch (error) {
      console.error('Error during RabbitMQ disconnection:', error)
      throw error
    }
  }

  async createChannel(name?: string): Promise<Channel> {
    await this.ensureConnected()
    
    const channelName = name || `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = await this.connection!.createChannel()
    
    channel.on('error', (error) => {
      console.error(`Channel ${channelName} error:`, error)
      this.channels.delete(channelName)
    })

    channel.on('close', () => {
      console.log(`Channel ${channelName} closed`)
      this.channels.delete(channelName)
    })

    this.channels.set(channelName, channel)
    console.log(`✅ Channel ${channelName} created`)
    
    return channel
  }

  async declareExchange(name: string, config: ExchangeConfig): Promise<void> {
    const channel = await this.createChannel(`exchange_${name}`)
    
    await channel.assertExchange(name, config.type, {
      durable: config.durable ?? true,
      autoDelete: config.autoDelete ?? false,
      arguments: config.arguments
    })
    
    console.log(`📤 Exchange ${name} (${config.type}) declared`)
  }

  async declareQueue(name: string, config: QueueConfig = {}): Promise<void> {
    const channel = await this.createChannel(`queue_${name}`)
    
    await channel.assertQueue(name, {
      durable: config.durable ?? true,
      exclusive: config.exclusive ?? false,
      autoDelete: config.autoDelete ?? false,
      arguments: {
        ...config.arguments,
        'x-dead-letter-exchange': config.deadLetterExchange,
        'x-dead-letter-routing-key': config.deadLetterRoutingKey,
        'x-message-ttl': config.messageTTL,
        'x-max-priority': config.maxPriority,
        'x-max-length': config.maxLength,
        'x-max-length-bytes': config.maxLengthBytes
      }
    })
    
    console.log(`📬 Queue ${name} declared`)
  }

  async bindQueue(queueName: string, exchangeName: string, routingKey: string = '', arguments_?: Record<string, any>): Promise<void> {
    const channel = await this.createChannel(`bind_${queueName}_${exchangeName}`)
    
    await channel.bindQueue(queueName, exchangeName, routingKey, arguments_)
    
    console.log(`🔗 Queue ${queueName} bound to exchange ${exchangeName} with key: ${routingKey}`)
  }

  async publish(
    exchangeName: string, 
    routingKey: string, 
    message: any, 
    options: MessageOptions = {}
  ): Promise<boolean> {
    await this.ensureConnected()
    
    const channel = await this.createChannel(`publish_${exchangeName}`)
    
    const messageContent = Buffer.from(JSON.stringify(message))
    
    const publishOptions = {
      persistent: options.persistent ?? true,
      expiration: options.expiration,
      priority: options.priority,
      messageId: options.messageId || this.generateMessageId(),
      correlationId: options.correlationId,
      replyTo: options.replyTo,
      type: options.type,
      contentType: options.contentType || 'application/json',
      contentEncoding: options.contentEncoding || 'utf-8',
      headers: options.headers,
      timestamp: Date.now()
    }
    
    const result = channel.publish(
      exchangeName,
      routingKey,
      messageContent,
      publishOptions
    )
    
    if (result) {
      console.log(`📤 Message published to ${exchangeName}/${routingKey}`)
      this.emit('messagePublished', { exchangeName, routingKey, message, options })
    } else {
      console.warn(`⚠️ Message could not be published (buffer full): ${exchangeName}/${routingKey}`)
    }
    
    return result
  }

  async consume(
    queueName: string,
    handler: (message: any, messageMeta: { deliveryTag: string, redelivered: boolean, exchange: string, routingKey: string }) => Promise<void> | void,
    options: ConsumeOptions = {},
    channelName?: string
  ): Promise<string> {
    await this.ensureConnected()
    
    const channel = await this.createChannel(channelName || `consume_${queueName}`)
    
    const consumerOptions = {
      consumerTag: options.consumerTag || `consumer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      noLocal: options.noLocal ?? false,
      noAck: options.noAck ?? false,
      exclusive: options.exclusive ?? false,
      priority: options.priority,
      arguments: options.arguments
    }
    
    const consumerTag = await channel.consume(queueName, async (message: ConsumeMessage | null) => {
      if (!message) return
      
      try {
        const messageContent = JSON.parse(message.content.toString())
        const messageMeta = {
          deliveryTag: message.fields.deliveryTag.toString(),
          redelivered: message.fields.redelivered,
          exchange: message.fields.exchange,
          routingKey: message.fields.routingKey,
          consumerTag: message.fields.consumerTag
        }
        
        await handler(messageContent, messageMeta)
        
        if (!consumerOptions.noAck) {
          channel.ack(message)
        }
        
      } catch (error) {
        console.error('Error processing message:', error)
        
        if (!consumerOptions.noAck) {
          // Send to dead letter queue or requeue
          channel.nack(message, false, !message.fields.redelivered)
        }
      }
    }, consumerOptions)
    
    this.consumers.set(consumerTag.consumerTag, {
      channel,
      queueName,
      options: consumerOptions
    })
    
    console.log(`👤 Consumer ${consumerTag.consumerTag} started for queue ${queueName}`)
    return consumerTag.consumerTag
  }

  async cancelConsumer(consumerTag: string): Promise<void> {
    const consumer = this.consumers.get(consumerTag)
    if (consumer) {
      await consumer.channel.cancel(consumerTag)
      this.consumers.delete(consumerTag)
      console.log(`👤 Consumer ${consumerTag} cancelled`)
    }
  }

  async getQueueStats(queueName: string): Promise<{ messageCount: number, consumerCount: number }> {
    await this.ensureConnected()
    
    const channel = await this.createChannel(`stats_${queueName}`)
    const queueInfo = await channel.checkQueue(queueName)
    
    return {
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.connection || !this.connection.ready) {
        return false
      }
      
      // Try to create a test channel and close it
      const testChannel = await this.connection.createChannel()
      await testChannel.close()
      
      return true
    } catch (error) {
      return false
    }
  }

  async getConnectionInfo(): Promise<any> {
    if (!this.connection) {
      return null
    }
    
    return {
      connected: this.connection.ready,
      serverProperties: this.connection.serverProperties,
      channels: this.channels.size,
      consumers: this.consumers.size,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection || !this.connection.ready) {
      await this.connect()
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default RabbitMQService