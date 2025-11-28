# 📦 **e-Estoque-API.Node**

Sistema **enterprise-grade** de gerenciamento de estoque construído com **Node.js + TypeScript**, **Express 5**, **TypeORM** e **PostgreSQL**. Arquitetura completa com **API Gateway**, **Event-Driven Architecture**, **Monitoring** e **Testing** abrangente.

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🏗️ **Status do Projeto**

### ✅ **TODAS AS FASES CONCLUÍDAS**

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 1** | Fundação e Infraestrutura | ✅ Concluída |
| **Fase 2** | Companies Module | ✅ Concluída |
| **Fase 3** | Products & Categories | ✅ Concluída |
| **Fase 4** | Customers Module | ✅ Concluída |
| **Fase 5** | Sales System | ✅ Concluída |
| **Fase 6** | Inventory Control | ✅ Concluída |
| **Fase 7** | Taxes System | ✅ Concluída |
| **Fase 8** | Integrations (Redis, RabbitMQ) | ✅ Concluída |
| **Fase 9** | Monitoring & Observability | ✅ Concluída |
| **Fase 10** | Testing & Quality Assurance | ✅ Concluída |

---

## 🎯 **Features Implementadas**

### **Core Business Modules**
- 🏢 **Companies** - Gestão completa de empresas com endereços
- 📦 **Products** - Catálogo de produtos com categorias hierárquicas
- 👥 **Customers** - Gestão de clientes com validação CPF/CNPJ
- 🛒 **Sales** - Sistema de vendas com controle transacional
- 📊 **Inventory** - Controle de estoque em tempo real
- 💰 **Taxes** - Sistema de cálculo de impostos

### **Technical Features**
- 🔐 **Authentication** - JWT + Keycloak com RBAC
- 🚪 **API Gateway** - Rate limiting, Circuit Breaker, Load Balancing
- 📨 **Event-Driven** - RabbitMQ + Domain Events
- ⚡ **Caching** - Redis para performance otimizada
- 📈 **Monitoring** - Prometheus + Grafana dashboards
- 🧪 **Testing** - Unit, Integration, E2E, Performance, Security

---

## 🚀 **Início Rápido**

### **Pré-requisitos**
- Node.js 22+
- Docker & Docker Compose
- pnpm 10+ (recomendado)

### **1. Clone e Configure**
```bash
# Clone o repositório
git clone https://github.com/mzet97/e-Estoque-API.Node.git
cd e-Estoque-API.Node

# Instale as dependências
pnpm install
```

### **2. Inicie Todos os Serviços**

**Linux/MacOS:**
```bash
./start-dev.sh start
```

**Windows (PowerShell):**
```powershell
docker-compose up -d
pnpm migration:run
pnpm dev
```

### **3. Acesse a Aplicação**

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API** | http://localhost:3000 | API Principal |
| **Swagger** | http://localhost:3000/api-docs | Documentação OpenAPI |
| **Health** | http://localhost:3000/health | Health Check |
| **Metrics** | http://localhost:3000/metrics | Prometheus Metrics |
| **Grafana** | http://localhost:3001 | Dashboards |
| **Prometheus** | http://localhost:9090 | Metrics Storage |
| **RabbitMQ** | http://localhost:15672 | Message Broker UI |
| **Keycloak** | http://localhost:8080 | Identity Provider |

---

## 🛠️ **Comandos de Desenvolvimento**

### **Aplicação**
```bash
pnpm dev              # Servidor em modo development
pnpm dev:gateway      # API Gateway em modo development
pnpm build            # Build TypeScript para produção
pnpm lint             # Executa ESLint
pnpm lint:fix         # Corrige problemas de linting
```

### **Database**
```bash
pnpm migration:run        # Executa migrações pendentes
pnpm migration:generate   # Gera nova migração
pnpm migration:revert     # Reverte última migração
pnpm seed:admin           # Cria usuário admin
pnpm db:reset             # Reset completo do banco
```

### **Testes**
```bash
pnpm test                 # Executa todos os testes
pnpm test:unit            # Apenas testes unitários
pnpm test:integration     # Apenas testes de integração
pnpm test:e2e             # Apenas testes E2E
pnpm test:coverage        # Testes com relatório de cobertura
pnpm test:performance     # Testes de performance
pnpm test:security        # Testes de segurança
pnpm test:all             # Executa toda a suite de testes
```

### **Infraestrutura**
```bash
docker-compose up -d                    # Inicia todos os serviços
docker-compose ps                       # Lista serviços
docker-compose logs -f e-estoque-api    # Logs da API
docker-compose down                     # Para todos os serviços
docker-compose down -v                  # Remove volumes também
```

---

## 🏗️ **Arquitetura**

### **Stack Tecnológico**

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Runtime** | Node.js | 22+ |
| **Framework** | Express.js | 5.x |
| **Linguagem** | TypeScript | 5.7 |
| **ORM** | TypeORM | 0.3 |
| **Database** | PostgreSQL | 15 |
| **Cache** | Redis | 7 |
| **Message Broker** | RabbitMQ | 3.12 |
| **Auth Provider** | Keycloak | 24 |
| **Metrics** | Prometheus | latest |
| **Dashboards** | Grafana | latest |
| **Testing** | Jest + Artillery | 29.x |

### **Padrões Arquiteturais**
- **Clean Architecture** - Separação clara de camadas
- **Domain-Driven Design** - Bounded contexts e agregados
- **Event-Driven Architecture** - Domain events com RabbitMQ
- **CQRS Pattern** - Separação de comandos e queries
- **Repository Pattern** - Abstração do acesso a dados
- **Dependency Injection** - tsyringe para IoC container
- **API Gateway Pattern** - Rate limiting, Circuit Breaker
- **Saga Pattern** - Transações distribuídas

---

## 📊 **Estrutura do Projeto**

```
e-Estoque-API.Node/
├── src/
│   ├── @types/                    # Type definitions
│   ├── categories/                # Módulo de Categorias
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── useCases/
│   ├── companies/                 # Módulo de Empresas
│   ├── companyAddress/            # Endereços de Empresas
│   ├── customers/                 # Módulo de Clientes
│   ├── customerAddress/           # Endereços de Clientes
│   ├── products/                  # Módulo de Produtos
│   ├── sales/                     # Módulo de Vendas
│   ├── inventory/                 # Controle de Estoque
│   ├── taxs/                      # Sistema de Impostos
│   ├── users/                     # Gestão de Usuários
│   ├── roles/                     # Gestão de Permissões
│   ├── gateway/                   # API Gateway
│   │   ├── core/                  # Gateway core logic
│   │   ├── middlewares/           # Rate limit, Circuit breaker
│   │   └── GatewayServer.ts       # Gateway entry point
│   ├── monitoring/                # Monitoring configs
│   └── shared/                    # Código compartilhado
│       ├── container/             # DI Container
│       ├── entities/              # Base entities
│       ├── errors/                # Error handlers
│       ├── events/                # Domain events
│       ├── http/                  # Express config, middlewares
│       ├── log/                   # Logging (Pino)
│       ├── redis/                 # Redis client
│       ├── repositories/          # Base repositories
│       ├── services/              # Shared services
│       │   ├── AlertingService.ts
│       │   ├── HealthCheckService.ts
│       │   ├── LoggerService.ts
│       │   ├── MetricsService.ts
│       │   └── TracingService.ts
│       └── typeorm/               # TypeORM config
├── tests/                         # Test suites
│   ├── setup/                     # Test configuration
│   ├── mocks/                     # Mock services
│   ├── utils/                     # Test utilities
│   └── load/                      # Load tests (Artillery)
├── config/                        # App configuration
│   ├── development.ts
│   ├── staging.ts
│   ├── production.ts
│   └── secrets/                   # Secrets management
├── docker/                        # Docker configurations
│   ├── kubernetes/                # K8s manifests
│   ├── nginx/                     # Nginx config
│   └── prometheus/                # Prometheus config
├── scripts/                       # Automation scripts
│   ├── backup/
│   ├── deployment/
│   └── database/
├── docker-compose.yml             # Full stack
├── docker-compose.dev.yml         # Development stack
├── Dockerfile                     # Production image
├── Dockerfile.dev                 # Development image
└── package.json
```

---

## 🔒 **Segurança**

### **Autenticação e Autorização**
- **JWT Tokens** - Access + Refresh tokens
- **Keycloak Integration** - SSO e identity management
- **Role-Based Access Control** - Permissões granulares
- **API Rate Limiting** - Proteção contra abuso

### **Proteções Implementadas**
- **Helmet** - Security headers automáticos
- **CORS** - Cross-Origin Resource Sharing configurado
- **Input Validation** - Celebrate/Joi validation
- **SQL Injection Prevention** - Queries parametrizadas
- **XSS Protection** - Content Security Policy
- **CSRF Protection** - Tokens de segurança
- **Data Encryption** - Senhas com bcrypt

### **Testes de Segurança**
- Authentication bypass attempts
- Input validation (SQL/NoSQL injection)
- XSS prevention
- Directory traversal
- Command injection
- Rate limiting effectiveness

---

## 📈 **Monitoring e Observabilidade**

### **Health Check Endpoints**
```bash
GET /health           # Basic health check
GET /health/detailed  # Detailed health (DB, Redis, RabbitMQ)
GET /health/ready     # Readiness probe (Kubernetes)
GET /health/live      # Liveness probe (Kubernetes)
GET /metrics          # Prometheus metrics
```

### **Métricas Coletadas**

**Business Metrics:**
- `sales_total` - Total de vendas
- `revenue_total` - Receita total
- `conversion_rate` - Taxa de conversão
- `inventory_value` - Valor do estoque

**Performance Metrics:**
- `http_request_duration_seconds` - Latência HTTP
- `database_query_duration_seconds` - Latência DB
- `cache_hit_ratio` - Taxa de acerto do cache
- `event_processing_duration` - Processamento de eventos

**System Metrics:**
- `cpu_usage_percent` - Uso de CPU
- `memory_usage_bytes` - Uso de memória
- `event_loop_delay_seconds` - Event loop delay
- `active_connections` - Conexões ativas

### **Dashboards Grafana**
- Application Overview
- System Resources
- Business Metrics
- Database & Cache Performance
- Health & Alerts

### **Alerting**
- Threshold-based alerts
- Multiple notification channels (Email, Slack, Webhook)
- Alert acknowledgment workflow
- Severity levels (Info, Warning, Critical)

---

## 🧪 **Testing**

### **Tipos de Teste Implementados**

| Tipo | Descrição | Comando |
|------|-----------|---------|
| **Unit** | Testes de componentes isolados | `pnpm test:unit` |
| **Integration** | Testes de integração entre módulos | `pnpm test:integration` |
| **E2E** | Fluxos completos end-to-end | `pnpm test:e2e` |
| **Performance** | Benchmarks e métricas | `pnpm test:performance` |
| **Load** | Testes de carga (Artillery) | `pnpm test:load` |
| **Security** | Testes de vulnerabilidades | `pnpm test:security` |

### **Cobertura de Testes**
- **Gateway Layer**: 90%+
- **Service Layer**: 85%+
- **Event System**: 85%+
- **Database Layer**: 80%+

### **Test Data Management**
- `TestDataManager` - Gerenciador centralizado de dados
- Entity factories para criação de dados
- Cleanup automático entre testes
- Fixtures para cenários específicos

---

## 🐳 **Docker**

### **Serviços Incluídos**
```yaml
services:
  - e-estoque-api     # API principal (porta 3000)
  - postgres          # PostgreSQL 15 (porta 5432)
  - redis             # Redis 7 (porta 6379)
  - rabbitmq          # RabbitMQ 3.12 (portas 5672, 15672)
  - keycloak          # Keycloak 24 (porta 8080)
  - prometheus        # Prometheus (porta 9090)
  - grafana           # Grafana (porta 3001)
  - nginx             # Reverse Proxy (portas 80, 443)
```

### **Ambientes**
```bash
# Development (com hot-reload)
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

---

## 🐛 **Troubleshooting**

### **Database Connection Failed**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres
docker-compose logs postgres

# Testar conectividade
docker exec estoque_postgres pg_isready -U estoque_user -d estoque_db
```

### **Redis Connection Failed**
```bash
# Verificar Redis
docker-compose ps redis
docker exec estoque_redis redis-cli ping
```

### **Migration Failed**
```bash
# Verificar status das migrações
pnpm db:migrate:status

# Executar migrações novamente
pnpm migration:run
```

### **Port Already in Use**
```powershell
# Windows - verificar portas
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

---

## 🤝 **Contribuição**

### **Workflow de Desenvolvimento**
1. **Fork** o repositório
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### **Standards de Código**
- **ESLint + Prettier** - Formatação automática
- **TypeScript strict mode** - Tipagem rigorosa
- **Conventional Commits** - Mensagens padronizadas
- **Code Review** - Pull requests obrigatórios
- **Test Coverage** - Mínimo 80%

### **Commit Message Format**
```
<type>(<scope>): <description>

feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de build
```

---

## 📚 **Documentação Adicional**

- [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) - Guia de upgrade entre versões
- [API Swagger](http://localhost:3000/api-docs) - Documentação interativa da API

---

## 📄 **Licença**

Este projeto está licenciado sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 **Autor**

**mzet97** - [GitHub](https://github.com/mzet97)

---

## 🎉 **Agradecimentos**

Obrigado a todos os contribuidores que ajudaram a tornar este projeto possível!

---

*Última atualização: 27 de Novembro de 2025*
*Versão: 1.0.0*
*Status: Production Ready* ✅
