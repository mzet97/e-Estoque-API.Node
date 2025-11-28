import { Express } from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'e-Estoque API Node.js',
    version: '1.0.0',
    description: 'Sistema de gerenciamento de estoque com Node.js, TypeScript e PostgreSQL',
    contact: {
      name: 'API Support',
      email: 'support@eestoque.com'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.eestoque.com' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
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
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Autenticação e autorização'
    },
    {
      name: 'Companies',
      description: 'Gerenciamento de empresas'
    },
    {
      name: 'Categories',
      description: 'Gerenciamento de categorias'
    },
    {
      name: 'Products',
      description: 'Gerenciamento de produtos'
    },
    {
      name: 'Customers',
      description: 'Gerenciamento de clientes'
    },
    {
      name: 'Sales',
      description: 'Gerenciamento de vendas'
    }
  ]
}

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/**/*Controller.ts',
    './src/shared/http/middlewares/*.ts',
    './src/shared/errors/*.ts'
  ]
}

const swaggerSpec = swaggerJSDoc(options)

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'e-Estoque API Documentation'
  }))
}

export { swaggerSpec }