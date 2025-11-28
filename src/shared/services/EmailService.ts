import { EventEmitter } from 'events'
import RedisClient from '@shared/redis/RedisClient'

export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp' | 'mock'
  from: string
  fromName?: string
  sendgrid?: {
    apiKey: string
  }
  ses?: {
    accessKeyId: string
    secretAccessKey: string
    region: string
  }
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
}

export interface EmailTemplate {
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

export interface EmailData {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
  template?: string
  templateData?: Record<string, any>
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  disposition?: 'attachment' | 'inline'
  contentId?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider: string
  timestamp: Date
}

export interface EmailStats {
  sent: number
  failed: number
  pending: number
  bounceRate: number
  openRate?: number
  clickRate?: number
  providerStats: Record<string, {
    sent: number
    failed: number
  }>
}

class EmailService extends EventEmitter {
  private redis: RedisClient
  private config: EmailConfig
  private provider: any
  private templates: Map<string, EmailTemplate> = new Map()
  private stats: EmailStats

  constructor(redis: RedisClient, config: EmailConfig) {
    super()
    this.redis = redis
    this.config = config
    this.stats = {
      sent: 0,
      failed: 0,
      pending: 0,
      bounceRate: 0,
      providerStats: {}
    }

    this.initializeProvider()
    this.loadTemplates()
  }

  private async initializeProvider(): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          await this.initializeSendGrid()
          break
        case 'ses':
          await this.initializeSES()
          break
        case 'smtp':
          await this.initializeSMTP()
          break
        case 'mock':
          await this.initializeMock()
          break
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`)
      }
      console.log(`✅ Email service initialized with ${this.config.provider} provider`)
    } catch (error) {
      console.error('Failed to initialize email provider:', error)
      throw error
    }
  }

  private async initializeSendGrid(): Promise<void> {
    if (!this.config.sendgrid?.apiKey) {
      throw new Error('SendGrid API key is required')
    }

    // For now, we'll use a mock implementation
    // In production, you would use @sendgrid/mail
    this.provider = {
      async sendEmail(emailData: EmailData): Promise<EmailResult> {
        // Mock implementation
        console.log(`📧 [SendGrid] Would send email to ${emailData.to}: ${emailData.subject}`)
        return {
          success: true,
          messageId: `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'sendgrid',
          timestamp: new Date()
        }
      }
    }
  }

  private async initializeSES(): Promise<void> {
    if (!this.config.ses?.accessKeyId || !this.config.ses.secretAccessKey) {
      throw new Error('AWS SES credentials are required')
    }

    // Mock implementation for SES
    this.provider = {
      async sendEmail(emailData: EmailData): Promise<EmailResult> {
        console.log(`📧 [SES] Would send email to ${emailData.to}: ${emailData.subject}`)
        return {
          success: true,
          messageId: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'ses',
          timestamp: new Date()
        }
      }
    }
  }

  private async initializeSMTP(): Promise<void> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration is required')
    }

    // Mock implementation for SMTP
    this.provider = {
      async sendEmail(emailData: EmailData): Promise<EmailResult> {
        console.log(`📧 [SMTP] Would send email to ${emailData.to}: ${emailData.subject}`)
        return {
          success: true,
          messageId: `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'smtp',
          timestamp: new Date()
        }
      }
    }
  }

  private async initializeMock(): Promise<void> {
    this.provider = {
      async sendEmail(emailData: EmailData): Promise<EmailResult> {
        console.log(`📧 [MOCK] Email to: ${emailData.to}`)
        console.log(`📧 [MOCK] Subject: ${emailData.subject}`)
        console.log(`📧 [MOCK] Content: ${emailData.textContent || emailData.htmlContent}`)
        
        return {
          success: true,
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'mock',
          timestamp: new Date()
        }
      }
    }
  }

  private loadTemplates(): void {
    // Welcome email template
    this.templates.set('welcome', {
      name: 'welcome',
      subject: 'Bem-vindo ao e-Estoque!',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Bem-vindo ao e-Estoque!</h1>
            <p>Olá {{name}},</p>
            <p>Obrigado por se cadastrar no e-Estoque. Sua conta foi criada com sucesso.</p>
            <p>Você pode fazer login usando seu email: {{email}}</p>
            <p>Se tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
            <br>
            <p>Atenciosamente,<br>Equipe e-Estoque</p>
          </body>
        </html>
      `,
      textContent: `
        Bem-vindo ao e-Estoque!
        
        Olá {{name}},
        
        Obrigado por se cadastrar no e-Estoque. Sua conta foi criada com sucesso.
        Você pode fazer login usando seu email: {{email}}
        
        Se tiver alguma dúvida, não hesite em entrar em contato conosco.
        
        Atenciosamente,
        Equipe e-Estoque
      `,
      variables: ['name', 'email']
    })

    // Sale confirmation template
    this.templates.set('sale_confirmation_pending', {
      name: 'sale_confirmation_pending',
      subject: 'Pedido #{{saleNumber}} recebido - Aguardando confirmação',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Pedido Recebido</h1>
            <p>Olá {{customerName}},</p>
            <p>Seu pedido foi recebido e está sendo processado.</p>
            <h3>Detalhes do Pedido:</h3>
            <ul>
              <li><strong>Número:</strong> {{saleNumber}}</li>
              <li><strong>Total:</strong> R$ {{total}}</li>
              <li><strong>Status:</strong> Aguardando confirmação</li>
            </ul>
            <p>Você receberá uma nova confirmação quando o pagamento for processado.</p>
            <br>
            <p>Atenciosamente,<br>Equipe e-Estoque</p>
          </body>
        </html>
      `,
      textContent: `
        Pedido Recebido
        
        Olá {{customerName}},
        
        Seu pedido foi recebido e está sendo processado.
        
        Detalhes do Pedido:
        - Número: {{saleNumber}}
        - Total: R$ {{total}}
        - Status: Aguardando confirmação
        
        Você receberá uma nova confirmação quando o pagamento for processado.
        
        Atenciosamente,
        Equipe e-Estoque
      `,
      variables: ['customerName', 'saleNumber', 'total']
    })

    // Sale confirmed template
    this.templates.set('sale_confirmed', {
      name: 'sale_confirmed',
      subject: 'Pedido #{{saleId}} confirmado!',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Pedido Confirmado!</h1>
            <p>Olá {{customerName}},</p>
            <p>Seu pedido foi confirmado e o pagamento foi processado com sucesso.</p>
            <h3>Detalhes do Pedido:</h3>
            <ul>
              <li><strong>Número:</strong> {{saleId}}</li>
              <li><strong>Método de Pagamento:</strong> {{paymentMethod}}</li>
              <li><strong>Status:</strong> Confirmado</li>
            </ul>
            <p>Obrigado pela sua compra!</p>
            <br>
            <p>Atenciosamente,<br>Equipe e-Estoque</p>
          </body>
        </html>
      `,
      textContent: `
        Pedido Confirmado!
        
        Olá {{customerName}},
        
        Seu pedido foi confirmado e o pagamento foi processado com sucesso.
        
        Detalhes do Pedido:
        - Número: {{saleId}}
        - Método de Pagamento: {{paymentMethod}}
        - Status: Confirmado
        
        Obrigado pela sua compra!
        
        Atenciosamente,
        Equipe e-Estoque
      `,
      variables: ['customerName', 'saleId', 'paymentMethod']
    })

    console.log(`📧 Loaded ${this.templates.size} email templates`)
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      this.stats.pending++

      // Process template if specified
      let processedEmailData = { ...emailData }
      if (emailData.template && this.templates.has(emailData.template)) {
        processedEmailData = await this.processTemplate(emailData.template, emailData.templateData || {})
      }

      // Set default from address
      if (!processedEmailData.from) {
        processedEmailData.from = this.config.from
      }

      const result = await this.provider.sendEmail(processedEmailData)
      
      // Update statistics
      if (result.success) {
        this.stats.sent++
        this.updateProviderStats(result.provider, 'sent')
      } else {
        this.stats.failed++
        this.updateProviderStats(result.provider, 'failed')
      }

      // Store email in Redis for tracking
      await this.storeEmailResult(result, processedEmailData)

      this.emit('emailSent', result, processedEmailData)
      
      console.log(`📧 Email ${result.success ? 'sent' : 'failed'} via ${result.provider}`)
      return result

    } catch (error) {
      this.stats.failed++
      this.updateProviderStats(this.config.provider, 'failed')
      
      const result: EmailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.config.provider,
        timestamp: new Date()
      }

      this.emit('emailFailed', result, emailData)
      return result
    } finally {
      this.stats.pending--
    }
  }

  async sendBulkEmails(emailDataList: EmailData[]): Promise<EmailResult[]> {
    const results: EmailResult[] = []
    
    // Process in batches to avoid overwhelming the provider
    const batchSize = 10
    for (let i = 0; i < emailDataList.length; i += batchSize) {
      const batch = emailDataList.slice(i, i + batchSize)
      const batchPromises = batch.map(emailData => this.sendEmail(emailData))
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            results.push({
              success: false,
              error: result.reason.message,
              provider: this.config.provider,
              timestamp: new Date()
            })
          }
        })
      } catch (error) {
        console.error('Error processing email batch:', error)
      }

      // Small delay between batches
      if (i + batchSize < emailDataList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  private async processTemplate(templateName: string, data: Record<string, any>): Promise<EmailData> {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }

    // Replace variables in subject and content
    let subject = template.subject
    let htmlContent = template.htmlContent
    let textContent = template.textContent

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value))
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return {
      to: data.to,
      subject,
      htmlContent,
      textContent,
      headers: {
        'X-Template': templateName
      }
    }
  }

  private async storeEmailResult(result: EmailResult, emailData: EmailData): Promise<void> {
    try {
      const key = `email:result:${result.messageId || Date.now()}`
      await this.redis.setex(key, 7 * 24 * 3600, JSON.stringify({
        result,
        emailData: {
          to: emailData.to,
          subject: emailData.subject,
          template: emailData.template
        },
        timestamp: result.timestamp.toISOString()
      }))
    } catch (error) {
      console.warn('Failed to store email result:', error)
    }
  }

  private updateProviderStats(provider: string, type: 'sent' | 'failed'): void {
    if (!this.stats.providerStats[provider]) {
      this.stats.providerStats[provider] = { sent: 0, failed: 0 }
    }
    this.stats.providerStats[provider][type]++
  }

  // Template management
  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template)
  }

  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name)
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name)
  }

  // Statistics and monitoring
  async getStatistics(): Promise<EmailStats> {
    try {
      // Update bounce rate from provider (mock implementation)
      this.stats.bounceRate = 0.02 // 2% mock bounce rate

      // Calculate open/click rates if available
      // This would typically come from email provider webhooks
      this.stats.openRate = 0.25 // 25% mock open rate
      this.stats.clickRate = 0.05 // 5% mock click rate

      return { ...this.stats }
    } catch (error) {
      console.error('Error getting email statistics:', error)
      return this.stats
    }
  }

  async getEmailHistory(limit: number = 100): Promise<any[]> {
    try {
      const keys = await this.redis.keys('email:result:*')
      const history: any[] = []

      for (const key of keys.slice(0, limit)) {
        const data = await this.redis.get(key)
        if (data) {
          history.push(JSON.parse(data))
        }
      }

      return history.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      console.error('Error getting email history:', error)
      return []
    }
  }

  // Health checks
  async isHealthy(): Promise<boolean> {
    try {
      // Test email provider connection
      const testResult = await this.provider.sendEmail({
        to: 'health@eestoque.local',
        subject: 'Health Check',
        textContent: 'This is a health check email'
      })
      return testResult.success
    } catch (error) {
      return false
    }
  }

  // Utility methods
  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  sanitizeEmailList(emails: string | string[]): string[] {
    const emailList = Array.isArray(emails) ? emails : [emails]
    return emailList.filter(email => this.validateEmail(email))
  }
}

export default EmailService