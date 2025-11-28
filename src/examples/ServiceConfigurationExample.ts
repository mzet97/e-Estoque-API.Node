// Exemplo de configuração e uso dos serviços da Fase 8
import ServiceContainer, { createServiceConfig } from '../shared/services/ServiceContainer'

// 1. Configuração de exemplo para desenvolvimento
const developmentConfig = createServiceConfig()

// 2. Configuração personalizada para produção
const productionConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'redis-cluster.eestoque.local',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || '0')
  },
  rabbitMQ: {
    host: process.env.RABBITMQ_HOST || 'rabbitmq-cluster.eestoque.local',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USERNAME || 'eestoque_user',
    password: process.env.RABBITMQ_PASSWORD || 'secure_password',
    vhost: '/eestoque'
  },
  email: {
    provider: 'sendgrid' as const,
    from: 'noreply@eestoque.com.br',
    fromName: 'e-Estoque',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY!
    }
  },
  fileStorage: {
    provider: 's3' as const,
    s3: {
      bucket: process.env.S3_BUCKET || 'eestoque-files',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      publicUrl: 'https://files.eestoque.com.br'
    }
  },
  pdfGeneration: {
    outputDirectory: '/app/pdfs',
    baseUrl: 'https://pdfs.eestoque.com.br',
    companyInfo: {
      name: 'e-Estoque Sistemas Ltda',
      document: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      phone: '(11) 3456-7890',
      email: 'contato@eestoque.com.br',
      logo: 'https://assets.eestoque.com.br/logo.png'
    }
  },
  cache: {
    defaultTTL: 3600,
    contextConfigs: {}
  },
  session: {
    ttl: 24 * 60 * 60, // 24 hours
    maxSessionsPerUser: 5,
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  }
}

// 3. Exemplo de inicialização dos serviços
async function initializeServices() {
  try {
    console.log('🚀 Inicializando serviços da Fase 8...')
    
    // Criar container de serviços
    const serviceContainer = ServiceContainer.getInstance(developmentConfig)
    
    // Inicializar todos os serviços
    await serviceContainer.initialize()
    
    console.log('✅ Todos os serviços inicializados com sucesso!')
    
    // Obter referências dos serviços
    const messageBus = serviceContainer.getMessageBus()
    const cache = serviceContainer.getCache()
    const session = serviceContainer.getSession()
    const email = serviceContainer.getEmail()
    const fileStorage = serviceContainer.getFileStorage()
    const pdf = serviceContainer.getPDF()
    
    return {
      serviceContainer,
      messageBus,
      cache,
      session,
      email,
      fileStorage,
      pdf
    }
  } catch (error) {
    console.error('❌ Falha ao inicializar serviços:', error)
    throw error
  }
}

// 4. Exemplos de uso dos serviços

// Exemplo 1: Publicando eventos de domínio
async function exemploPublicacaoEventos(messageBus: any) {
  console.log('📡 Exemplo: Publicação de eventos...')
  
  // Importar eventos
  const { CustomerCreatedEvent, SaleCreatedEvent } = await import('../shared/events/DomainEvents')
  
  // Criar evento de cliente
  const customerEvent = new CustomerCreatedEvent(
    'customer-123',
    {
      name: 'João Silva',
      email: 'joao@email.com',
      document: '123.456.789-00',
      phone: '(11) 99999-9999',
      companyId: 'company-456'
    }
  )
  
  // Publicar evento
  await messageBus.publish(customerEvent)
  console.log('✅ Evento de cliente publicado')
  
  // Criar evento de venda
  const saleEvent = new SaleCreatedEvent(
    'sale-789',
    {
      saleNumber: 'VND-001',
      customerId: 'customer-123',
      items: [
        {
          productId: 'product-001',
          quantity: 2,
          unitPrice: 99.99
        }
      ],
      total: 199.98,
      status: 'pending'
    }
  )
  
  await messageBus.publish(saleEvent)
  console.log('✅ Evento de venda publicado')
}

// Exemplo 2: Cache de dados
async function exemploCache(cache: any) {
  console.log('💾 Exemplo: Operações de cache...')
  
  // Get or set cache
  const produtos = await cache.getWithContext(
    'produtos-destaque',
    'products',
    async () => {
      // Simular busca no banco
      return [
        { id: '1', nome: 'Produto A', preco: 99.99 },
        { id: '2', nome: 'Produto B', preco: 149.99 }
      ]
    }
  )
  
  console.log('📦 Produtos em cache:', produtos)
  
  // Cache manual
  await cache.set('cliente:123', { nome: 'João Silva', email: 'joao@email.com' }, 3600, 'customers')
  const cliente = await cache.get('cliente:123', 'customers')
  console.log('👤 Cliente em cache:', cliente)
  
  // Invalidar cache por padrão
  const deleted = await cache.deleteByPattern('produtos:*', 'products')
  console.log(`🗑️ Invalidados ${deleted} chaves de cache`)
}

// Exemplo 3: Gerenciamento de sessões
async function exemploSessoes(session: any) {
  console.log('👤 Exemplo: Gerenciamento de sessões...')
  
  // Criar sessão
  const novaSessao = await session.createSession(
    'user-123',
    {
      preferences: { theme: 'dark', language: 'pt-BR' },
      cart: [],
      lastActivity: Date.now()
    },
    'company-456',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  )
  
  console.log('🆕 Nova sessão criada:', novaSessao.id)
  
  // Buscar sessão
  const sessaoRecuperada = await session.getSession(novaSessao.id)
  console.log('📋 Sessão recuperada:', sessaoRecuperada?.id)
  
  // Atualizar sessão
  await session.updateSession(novaSessao.id, {
    lastActivity: Date.now(),
    pageView: '/dashboard'
  })
  
  // Listar sessões do usuário
  const sessoesUsuario = await session.getUserSessions('user-123')
  console.log(`👥 Usuário possui ${sessoesUsuario.length} sessões ativas`)
}

// Exemplo 4: Envio de emails
async function exemploEmails(email: any) {
  console.log('📧 Exemplo: Envio de emails...')
  
  // Envio com template
  const resultadoEmail = await email.sendEmail({
    to: 'cliente@email.com',
    template: 'welcome',
    templateData: {
      name: 'João Silva',
      email: 'cliente@email.com'
    }
  })
  
  console.log('📬 Email enviado:', resultadoEmail.success ? 'Sucesso' : 'Falha')
  
  // Envio customizado
  const emailCustomizado = await email.sendEmail({
    to: 'admin@eestoque.com',
    cc: ['manager@eestoque.com'],
    subject: 'Relatório de Vendas - Diário',
    htmlContent: '<h1>Relatório do dia</h1><p>Vendas: R$ 15.000</p>',
    textContent: 'Relatório do dia - Vendas: R$ 15.000',
    headers: {
      'X-Priority': '1',
      'X-Report-Type': 'daily-sales'
    }
  })
  
  console.log('📊 Email customizado enviado:', emailCustomizado.success ? 'Sucesso' : 'Falha')
  
  // Bulk emails
  const listaEmails = [
    {
      to: 'user1@email.com',
      template: 'sale_confirmed',
      templateData: { customerName: 'Maria', saleId: '123' }
    },
    {
      to: 'user2@email.com', 
      template: 'sale_confirmed',
      templateData: { customerName: 'Pedro', saleId: '124' }
    }
  ]
  
  const resultadosBulk = await email.sendBulkEmails(listaEmails)
  console.log(`📬 Bulk emails: ${resultadosBulk.filter(r => r.success).length}/${resultadosBulk.length} enviados`)
}

// Exemplo 5: Upload de arquivos
async function exemploArquivos(fileStorage: any) {
  console.log('📁 Exemplo: Upload de arquivos...')
  
  // Simular arquivo de upload (em produção viria do multer)
  const arquivoMock = {
    originalname: 'relatorio-vendas.pdf',
    mimetype: 'application/pdf',
    size: 1024000, // 1MB
    buffer: Buffer.from('conteudo do pdf...')
  } as Express.Multer.File
  
  // Upload simples
  const arquivo = await fileStorage.uploadFile(arquivoMock, {
    folder: 'reports',
    filename: 'vendas-novembro-2025.pdf',
    metadata: {
      reportType: 'sales',
      period: '2025-11',
      generatedBy: 'system'
    }
  })
  
  console.log('📄 Arquivo enviado:', arquivo.filename)
  console.log('🔗 URL do arquivo:', await fileStorage.getFileUrl(arquivo.path))
  
  // Upload múltiplos arquivos
  const arquivosMultiplos = await fileStorage.uploadMultipleFiles(
    [arquivoMock, arquivoMock],
    {
      folder: 'invoices',
      metadata: { batch: 'invoice-batch-001' }
    }
  )
  
  console.log(`📚 ${arquivosMultiplos.length} arquivos enviados em lote`)
}

// Exemplo 6: Geração de PDFs
async function exemploPDFs(pdf: any) {
  console.log('📄 Exemplo: Geração de PDFs...')
  
  // Relatório de vendas
  const relatorioVendas = await pdf.generatePDF({
    title: 'Relatório de Vendas - Novembro 2025',
    template: 'sales-report',
    data: {
      salesData: {
        totalSales: 150,
        totalAmount: 25750.50,
        averageAmount: 171.67,
        sales: [
          {
            date: new Date(),
            number: 'VND-001',
            customerName: 'João Silva',
            amount: 299.99,
            status: 'confirmed'
          }
        ]
      },
      period: '01/11/2025 a 30/11/2025',
      companyInfo: {
        name: 'e-Estoque',
        document: '12.345.678/0001-90'
      }
    }
  })
  
  console.log('📊 PDF de vendas gerado:', relatorioVendas.success ? 'Sucesso' : 'Falha')
  
  // Nota fiscal
  const notaFiscal = await pdf.generatePDF({
    title: 'Nota Fiscal #12345',
    template: 'invoice',
    data: {
      invoiceData: {
        number: '12345',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customer: {
          name: 'Cliente Exemplo Ltda',
          document: '98.765.432/0001-10',
          address: 'Rua das Flores, 123 - São Paulo, SP'
        },
        items: [
          {
            code: 'PROD001',
            description: 'Produto Exemplo',
            quantity: 2,
            unitPrice: 99.99,
            total: 199.98
          }
        ],
        subtotal: 199.98,
        discount: 0,
        total: 199.98,
        notes: 'Pagamento à vista'
      },
      companyInfo: {
        name: 'e-Estoque',
        document: '12.345.678/0001-90',
        address: 'Av. Paulista, 1000',
        phone: '(11) 3456-7890',
        email: 'contato@eestoque.com.br'
      }
    }
  })
  
  console.log('🧾 PDF de nota fiscal gerado:', notaFiscal.success ? 'Sucesso' : 'Falha')
}

// 5. Exemplo completo de uso integrado
async function exemploCompleto() {
  console.log('🎯 Exemplo completo integrado...\')
  
  try {
    // Inicializar serviços
    const services = await initializeServices()
    const { messageBus, cache, session, email, fileStorage, pdf } = services
    
    // Demonstrar uso integrado
    await exemploPublicacaoEventos(messageBus)
    await exemploCache(cache)
    await exemploSessoes(session)
    await exemploEmails(email)
    await exemploArquivos(fileStorage)
    await exemploPDFs(pdf)
    
    // Verificar saúde dos serviços
    const healthStatus = await services.serviceContainer.getHealthStatus()
    console.log('🏥 Status dos serviços:', healthStatus.overall)
    
    // Estatísticas dos serviços
    const cacheStats = await cache.getStatistics()
    console.log('💾 Estatísticas de cache:', cacheStats.hitRate.toFixed(2))
    
    const sessionStats = await session.getStatistics()
    console.log('👤 Estatísticas de sessão:', sessionStats.activeSessions)
    
    const emailStats = await email.getStatistics()
    console.log('📧 Estatísticas de email:', emailStats.sent)
    
    console.log('✅ Exemplo completo executado com sucesso!')
    
    // Graceful shutdown
    await services.serviceContainer.shutdown()
    
  } catch (error) {
    console.error('❌ Erro no exemplo completo:', error)
  }
}

// 6. Exportar para uso
export {
  initializeServices,
  exemploPublicacaoEventos,
  exemploCache,
  exemploSessoes,
  exemploEmails,
  exemploArquivos,
  exemploPDFs,
  exemploCompleto
}

// 7. Executar exemplo se chamado diretamente
if (require.main === module) {
  exemploCompleto().catch(console.error)
}