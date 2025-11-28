import { EventEmitter } from 'events'
import { createWriteStream, promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface PDFConfig {
  outputDirectory: string
  baseUrl?: string
  companyInfo: {
    name: string
    document: string
    address: string
    phone: string
    email: string
    logo?: string
  }
  fonts?: {
    regular?: string
    bold?: string
    italic?: string
  }
}

export interface PDFTemplate {
  name: string
  description: string
  generate: (data: any) => string
}

export interface PDFData {
  title: string
  template?: string
  data: Record<string, any>
  options?: {
    format?: 'A4' | 'A3' | 'Letter'
    orientation?: 'portrait' | 'landscape'
    margins?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
    header?: boolean
    footer?: boolean
  }
}

export interface PDFResult {
  success: boolean
  fileId?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  downloadUrl?: string
  error?: string
  generationTime: number
}

export interface PDFStatistics {
  totalGenerated: number
  successRate: number
  averageGenerationTime: number
  templatesUsed: Record<string, number>
  totalSize: number
  errors: Array<{
    template: string
    error: string
    timestamp: Date
  }>
}

class PDFGenerationService extends EventEmitter {
  private config: PDFConfig
  private templates: Map<string, PDFTemplate> = new Map()
  private statistics: PDFStatistics

  constructor(config: PDFConfig) {
    super()
    this.config = config
    this.statistics = {
      totalGenerated: 0,
      successRate: 0,
      averageGenerationTime: 0,
      templatesUsed: {},
      totalSize: 0,
      errors: []
    }

    this.loadDefaultTemplates()
  }

  private loadDefaultTemplates(): void {
    // Sales Report Template
    this.templates.set('sales-report', {
      name: 'sales-report',
      description: 'Sales performance report',
      generate: (data: any) => this.generateSalesReportHTML(data)
    })

    // Invoice Template
    this.templates.set('invoice', {
      name: 'invoice',
      description: 'Sales invoice',
      generate: (data: any) => this.generateInvoiceHTML(data)
    })

    // Inventory Report Template
    this.templates.set('inventory-report', {
      name: 'inventory-report',
      description: 'Inventory status report',
      generate: (data: any) => this.generateInventoryReportHTML(data)
    })

    // Customer Report Template
    this.templates.set('customer-report', {
      name: 'customer-report',
      description: 'Customer analytics report',
      generate: (data: any) => this.generateCustomerReportHTML(data)
    })

    console.log(`📄 Loaded ${this.templates.size} PDF templates`)
  }

  async generatePDF(pdfData: PDFData): Promise<PDFResult> {
    const startTime = Date.now()
    
    try {
      this.statistics.totalGenerated++

      // Validate input
      this.validatePDFData(pdfData)

      // Get template
      const templateName = pdfData.template || 'default'
      const template = this.templates.get(templateName)
      
      if (!template) {
        throw new Error(`Template not found: ${templateName}`)
      }

      // Generate HTML content
      const htmlContent = template.generate(pdfData.data)
      
      // Create full HTML document
      const fullHTML = this.createFullHTMLDocument(htmlContent, pdfData.title, pdfData.options)

      // Generate PDF filename
      const fileName = this.generateFileName(pdfData.title, pdfData.options)
      const filePath = join(this.config.outputDirectory, fileName)

      // Ensure output directory exists
      await fs.mkdir(this.config.outputDirectory, { recursive: true })

      // In a real implementation, you would use a PDF library like Puppeteer or PDFKit
      // For now, we'll just save the HTML as a file (mock implementation)
      await fs.writeFile(filePath, fullHTML, 'utf-8')

      // Mock PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get file stats
      const stats = await fs.stat(filePath)

      // Update statistics
      this.updateStatistics(templateName, true, Date.now() - startTime, stats.size)

      const result: PDFResult = {
        success: true,
        fileId: uuidv4(),
        filePath,
        fileName,
        fileSize: stats.size,
        downloadUrl: this.config.baseUrl ? `${this.config.baseUrl}/files/${fileName}` : undefined,
        generationTime: Date.now() - startTime
      }

      this.emit('pdfGenerated', result, pdfData)
      console.log(`📄 PDF generated: ${fileName} in ${result.generationTime}ms`)

      return result

    } catch (error) {
      const generationTime = Date.now() - startTime
      
      // Update statistics
      this.updateStatistics('unknown', false, generationTime, 0, error instanceof Error ? error.message : 'Unknown error')

      const result: PDFResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime
      }

      this.emit('pdfGenerationError', result, pdfData)
      return result
    }
  }

  async generateBatchPDF(pdfDataList: PDFData[]): Promise<PDFResult[]> {
    const results: PDFResult[] = []
    
    // Process in parallel with a limit
    const batchSize = 5
    for (let i = 0; i < pdfDataList.length; i += batchSize) {
      const batch = pdfDataList.slice(i, i + batchSize)
      const batchPromises = batch.map(data => this.generatePDF(data))
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            results.push({
              success: false,
              error: result.reason.message,
              generationTime: 0
            })
          }
        })
      } catch (error) {
        console.error('Error processing PDF batch:', error)
      }
    }

    return results
  }

  // Template methods
  private generateSalesReportHTML(data: any): string {
    const { salesData, period, companyInfo } = data

    return `
      <div class="report-header">
        <h1>Relatório de Vendas</h1>
        <div class="company-info">
          <h2>${companyInfo.name}</h2>
          <p>CNPJ: ${companyInfo.document}</p>
          <p>Período: ${period}</p>
        </div>
      </div>
      
      <div class="summary">
        <h3>Resumo</h3>
        <table>
          <tr><td>Total de Vendas:</td><td>${salesData.totalSales}</td></tr>
          <tr><td>Valor Total:</td><td>R$ ${salesData.totalAmount.toFixed(2)}</td></tr>
          <tr><td>Média por Venda:</td><td>R$ ${salesData.averageAmount.toFixed(2)}</td></tr>
        </table>
      </div>
      
      <div class="details">
        <h3>Detalhamento</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Número</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${salesData.sales.map((sale: any) => `
              <tr>
                <td>${new Date(sale.date).toLocaleDateString()}</td>
                <td>${sale.number}</td>
                <td>${sale.customerName}</td>
                <td>R$ ${sale.amount.toFixed(2)}</td>
                <td>${sale.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  private generateInvoiceHTML(data: any): string {
    const { invoiceData, companyInfo } = data

    return `
      <div class="invoice">
        <div class="invoice-header">
          <div class="company-logo">
            ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Logo" />` : ''}
          </div>
          <div class="company-details">
            <h1>${companyInfo.name}</h1>
            <p>CNPJ: ${companyInfo.document}</p>
            <p>${companyInfo.address}</p>
            <p>Telefone: ${companyInfo.phone}</p>
            <p>Email: ${companyInfo.email}</p>
          </div>
        </div>
        
        <div class="invoice-info">
          <h2>NOTA FISCAL</h2>
          <div class="invoice-details">
            <p><strong>Número:</strong> ${invoiceData.number}</p>
            <p><strong>Data:</strong> ${new Date(invoiceData.date).toLocaleDateString()}</p>
            <p><strong>Vencimento:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
          </div>
          
          <div class="customer-info">
            <h3>Dados do Cliente</h3>
            <p><strong>${invoiceData.customer.name}</strong></p>
            <p>CNPJ/CPF: ${invoiceData.customer.document}</p>
            <p>${invoiceData.customer.address}</p>
          </div>
        </div>
        
        <div class="items">
          <table class="invoice-items">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item: any) => `
                <tr>
                  <td>${item.code}</td>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unitPrice.toFixed(2)}</td>
                  <td>R$ ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="invoice-totals">
          <table>
            <tr><td>Subtotal:</td><td>R$ ${invoiceData.subtotal.toFixed(2)}</td></tr>
            <tr><td>Desconto:</td><td>R$ ${invoiceData.discount.toFixed(2)}</td></tr>
            <tr><td><strong>Total:</strong></td><td><strong>R$ ${invoiceData.total.toFixed(2)}</strong></td></tr>
          </table>
        </div>
        
        <div class="invoice-footer">
          <p>Observações: ${invoiceData.notes || 'Nenhuma observação'}</p>
        </div>
      </div>
    `
  }

  private generateInventoryReportHTML(data: any): string {
    const { inventoryData, companyInfo } = data

    return `
      <div class="report-header">
        <h1>Relatório de Inventário</h1>
        <div class="company-info">
          <h2>${companyInfo.name}</h2>
          <p>Data: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div class="summary">
        <h3>Resumo do Estoque</h3>
        <table>
          <tr><td>Total de Produtos:</td><td>${inventoryData.totalProducts}</td></tr>
          <tr><td>Valor Total do Estoque:</td><td>R$ ${inventoryData.totalValue.toFixed(2)}</td></tr>
          <tr><td>Produtos com Estoque Baixo:</td><td>${inventoryData.lowStockProducts}</td></tr>
          <tr><td>Produtos sem Estoque:</td><td>${inventoryData.outOfStockProducts}</td></tr>
        </table>
      </div>
      
      <div class="low-stock">
        <h3>Produtos com Estoque Baixo</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Estoque Atual</th>
              <th>Estoque Mínimo</th>
              <th>Valor Unitário</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryData.lowStockItems.map((item: any) => `
              <tr class="low-stock-item">
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.minimumStock}</td>
                <td>R$ ${item.unitPrice.toFixed(2)}</td>
                <td>R$ ${(item.currentStock * item.unitPrice).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  private generateCustomerReportHTML(data: any): string {
    const { customerData, companyInfo } = data

    return `
      <div class="report-header">
        <h1>Relatório de Clientes</h1>
        <div class="company-info">
          <h2>${companyInfo.name}</h2>
          <p>Data: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div class="summary">
        <h3>Resumo de Clientes</h3>
        <table>
          <tr><td>Total de Clientes:</td><td>${customerData.totalCustomers}</td></tr>
          <tr><td>Clientes Ativos:</td><td>${customerData.activeCustomers}</td></tr>
          <tr><td>Clientes Novos (Mês):</td><td>${customerData.newCustomers}</td></tr>
          <tr><td>Ticket Médio:</td><td>R$ ${customerData.averageTicket.toFixed(2)}</td></tr>
        </table>
      </div>
      
      <div class="top-customers">
        <h3>Top 10 Clientes</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total de Pedidos</th>
              <th>Valor Total</th>
              <th>Último Pedido</th>
            </tr>
          </thead>
          <tbody>
            ${customerData.topCustomers.map((customer: any) => `
              <tr>
                <td>${customer.name}</td>
                <td>${customer.totalOrders}</td>
                <td>R$ ${customer.totalValue.toFixed(2)}</td>
                <td>${new Date(customer.lastOrder).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  private createFullHTMLDocument(content: string, title: string, options?: any): string {
    const format = options?.format || 'A4'
    const orientation = options?.orientation || 'portrait'
    const margins = options?.margins || {}

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: ${format} ${orientation};
      margin: ${margins.top || 20}px ${margins.right || 20}px ${margins.bottom || 20}px ${margins.left || 20}px;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    
    .company-info {
      margin-top: 15px;
      font-size: 14px;
    }
    
    .summary {
      margin: 20px 0;
    }
    
    .summary h3 {
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    .data-table th,
    .data-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    .data-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .low-stock-item {
      background-color: #fff3cd;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    
    .company-logo img {
      max-height: 80px;
    }
    
    .invoice-info {
      margin: 20px 0;
    }
    
    .invoice-details,
    .customer-info {
      margin: 15px 0;
      padding: 10px;
      background-color: #f9f9f9;
    }
    
    .invoice-items {
      margin: 20px 0;
    }
    
    .invoice-totals {
      margin: 20px 0;
      float: right;
    }
    
    .invoice-totals table {
      width: auto;
      min-width: 300px;
    }
    
    .invoice-footer {
      clear: both;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
    `
  }

  // Utility methods
  private validatePDFData(data: PDFData): void {
    if (!data.title) {
      throw new Error('PDF title is required')
    }
    
    if (!data.data) {
      throw new Error('PDF data is required')
    }
  }

  private generateFileName(title: string, options?: any): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${sanitizedTitle}-${timestamp}.pdf`
  }

  private updateStatistics(
    templateName: string, 
    success: boolean, 
    generationTime: number, 
    fileSize: number, 
    error?: string
  ): void {
    // Update template usage
    this.statistics.templatesUsed[templateName] = (this.statistics.templatesUsed[templateName] || 0) + 1

    if (success) {
      this.statistics.totalSize += fileSize
    }

    // Update average generation time
    this.statistics.averageGenerationTime = 
      (this.statistics.averageGenerationTime + generationTime) / 2

    // Update success rate
    const successful = this.statistics.totalGenerated - this.statistics.errors.length
    this.statistics.successRate = successful / this.statistics.totalGenerated

    // Add error if failed
    if (!success && error) {
      this.statistics.errors.push({
        template: templateName,
        error,
        timestamp: new Date()
      })

      // Keep only last 100 errors
      if (this.statistics.errors.length > 100) {
        this.statistics.errors = this.statistics.errors.slice(-100)
      }
    }
  }

  // Template management
  addTemplate(template: PDFTemplate): void {
    this.templates.set(template.name, template)
  }

  getTemplate(name: string): PDFTemplate | undefined {
    return this.templates.get(name)
  }

  getAllTemplates(): PDFTemplate[] {
    return Array.from(this.templates.values())
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name)
  }

  // Statistics
  getStatistics(): PDFStatistics {
    return { ...this.statistics }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await fs.access(this.config.outputDirectory)
      return true
    } catch (error) {
      return false
    }
  }
}

export default PDFGenerationService