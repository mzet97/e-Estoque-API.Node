import { Express } from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'e-Estoque API Node.js',
    version: '1.0.0',
    description: 'Sistema completo de gerenciamento de estoque com Node.js, TypeScript e PostgreSQL. API RESTful com suporte a OData, autenticação JWT, e documentação completa.',
    contact: {
      name: 'Matheus Zeitune',
      email: 'matheus.zeitune.developer@gmail.com',
      url: 'https://github.com/matheuszeitune'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.eestoque.com/api/v1',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
      }
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          error: { type: 'string', description: 'Error details' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'number', example: 1 },
          pageSize: { type: 'number', example: 15 },
          total: { type: 'number', example: 100 },
          totalPages: { type: 'number', example: 7 }
        }
      },
      PagedResult: {
        type: 'object',
        properties: {
          items: { type: 'array', items: {} },
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          pageSize: { type: 'number', example: 15 },
          totalPages: { type: 'number', example: 7 }
        }
      },

      // Category schemas
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
          name: { type: 'string', example: 'Electronics', minLength: 3, maxLength: 80 },
          description: { type: 'string', example: 'Electronic devices and accessories', minLength: 3, maxLength: 250 },
          slug: { type: 'string', example: 'electronics' },
          isActive: { type: 'boolean', example: true },
          sortOrder: { type: 'number', example: 1, default: 0 },
          parentCategory: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            }
          },
          subCategories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['name', 'description'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 80, example: 'Electronics' },
          description: { type: 'string', minLength: 3, maxLength: 250, example: 'Electronic devices' },
          parentId: { type: 'string', format: 'uuid', nullable: true, description: 'Parent category ID' },
          sortOrder: { type: 'number', default: 0, example: 1 }
        }
      },
      UpdateCategoryRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 80 },
          description: { type: 'string', minLength: 3, maxLength: 250 },
          parentId: { type: 'string', format: 'uuid', nullable: true },
          isActive: { type: 'boolean' },
          sortOrder: { type: 'number' }
        }
      },

      // Company schemas
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Tech Solutions LTDA', minLength: 3, maxLength: 80 },
          docId: { type: 'string', example: '12.345.678/0001-90', minLength: 11, maxLength: 18 },
          email: { type: 'string', format: 'email', example: 'contato@tech.com', maxLength: 250 },
          description: { type: 'string', example: 'Technology solutions', maxLength: 250 },
          phoneNumber: { type: 'string', example: '+55 11 99999-9999', maxLength: 20 },
          companyAddress: {
            type: 'object',
            properties: {
              street: { type: 'string', example: 'Rua das Flores, 123' },
              number: { type: 'string', example: '123' },
              complement: { type: 'string', example: 'Sala 456', nullable: true },
              neighborhood: { type: 'string', example: 'Centro' },
              district: { type: 'string', example: 'São Paulo' },
              city: { type: 'string', example: 'São Paulo' },
              state: { type: 'string', example: 'SP' },
              country: { type: 'string', example: 'Brasil' },
              zipCode: { type: 'string', example: '01234-567' },
              latitude: { type: 'string', example: '-23.5505', nullable: true },
              longitude: { type: 'string', example: '-46.6333', nullable: true }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Customer schemas
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'João Silva', minLength: 3, maxLength: 80 },
          docId: { type: 'string', example: '123.456.789-00', minLength: 11, maxLength: 14 },
          email: { type: 'string', format: 'email', example: 'joao@email.com', maxLength: 250 },
          description: { type: 'string', example: 'Regular customer', maxLength: 250 },
          phoneNumber: { type: 'string', example: '+55 11 88888-8888', maxLength: 20 },
          customerAddress: {
            type: 'object',
            properties: {
              street: { type: 'string', example: 'Av. Paulista, 1000' },
              number: { type: 'string', example: '1000' },
              complement: { type: 'string', nullable: true },
              neighborhood: { type: 'string', example: 'Bela Vista' },
              district: { type: 'string', example: 'São Paulo' },
              city: { type: 'string', example: 'São Paulo' },
              state: { type: 'string', example: 'SP' },
              country: { type: 'string', example: 'Brasil' },
              zipCode: { type: 'string', example: '01310-100' },
              latitude: { type: 'string', nullable: true },
              longitude: { type: 'string', nullable: true }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Product schemas
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Smartphone Samsung Galaxy', minLength: 3, maxLength: 80 },
          description: { type: 'string', example: 'Latest model smartphone', maxLength: 250 },
          sku: { type: 'string', example: 'SAM-GAL-S24', minLength: 3, maxLength: 50 },
          price: { type: 'number', format: 'float', example: 999.99, minimum: 0 },
          cost: { type: 'number', format: 'float', example: 699.99, minimum: 0 },
          category: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            }
          },
          tax: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              percentage: { type: 'number', format: 'float' }
            }
          },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Sale schemas
      Sale: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          saleNumber: { type: 'string', example: 'V2025001' },
          customer: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            }
          },
          total: { type: 'number', format: 'float', example: 1599.98, minimum: 0 },
          discount: { type: 'number', format: 'float', example: 0, minimum: 0 },
          taxTotal: { type: 'number', format: 'float', example: 239.99, minimum: 0 },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
            example: 'completed'
          },
          saleProducts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                product: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    price: { type: 'number', format: 'float' }
                  }
                },
                quantity: { type: 'number', example: 2, minimum: 1 },
                unitPrice: { type: 'number', format: 'float', example: 799.99 },
                totalPrice: { type: 'number', format: 'float', example: 1599.98 }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },

      // Inventory schemas
      Inventory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          product: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              sku: { type: 'string' }
            }
          },
          quantity: { type: 'number', example: 50, minimum: 0 },
          minimumStock: { type: 'number', example: 10, minimum: 0 },
          location: { type: 'string', example: 'Warehouse A - Shelf 5' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Tax schemas
      Tax: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'ICMS', minLength: 2, maxLength: 50 },
          percentage: { type: 'number', format: 'float', example: 18.0, minimum: 0, maximum: 100 },
          description: { type: 'string', example: 'Imposto sobre Circulação', maxLength: 250 },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Admin User', minLength: 3, maxLength: 80 },
          email: { type: 'string', format: 'email', example: 'admin@e-estoque.com' },
          isActive: { type: 'boolean', example: true },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'Admin' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },

      // Role schemas
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Admin', minLength: 2, maxLength: 50 },
          description: { type: 'string', example: 'System administrator', maxLength: 250 },
          isDeleted: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updateAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },

      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@e-estoque.com' },
          password: { type: 'string', format: 'password', example: 'SuperSecret123!' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              expiresIn: { type: 'number', example: 3600 },
              user: { $ref: '#/components/schemas/User' }
            }
          },
          message: { type: 'string', example: 'Login realizado com sucesso' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Categories', description: 'Gerenciamento de categorias de produtos' },
    { name: 'Companies', description: 'Gerenciamento de empresas' },
    { name: 'Customers', description: 'Gerenciamento de clientes' },
    { name: 'Products', description: 'Gerenciamento de produtos' },
    { name: 'Sales', description: 'Gerenciamento de vendas' },
    { name: 'Inventory', description: 'Gerenciamento de estoque' },
    { name: 'Taxes', description: 'Configuração de impostos' },
    { name: 'Users', description: 'Gerenciamento de usuários' },
    { name: 'Roles', description: 'Gerenciamento de papéis e permissões' },
    { name: 'Health', description: 'Health check endpoints' }
  ]
}

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/**/*Controller.ts',
    './src/shared/http/middlewares/*.ts',
    './src/shared/errors/*.ts',
    './src/shared/http/routes/*.ts'
  ]
}

const swaggerSpec = swaggerJSDoc(options)

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'e-Estoque API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }))

  // Also serve the raw OpenAPI spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
}

export { swaggerSpec }
