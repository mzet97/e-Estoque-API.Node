import { Router } from 'express'
import { rolesRouter } from '@roles/http/routes/roles.routes'
import { companiesRouter } from '@companies/http/routes/companies.routes'
import { categoriesRouter } from '@categories/http/routes/categories.routes'
import { productsRouter } from '@products/http/routes/products.routes'
import { router as simpleCustomersRouter } from '@customers/routes/SimpleCustomerRoutes'
import { salesRouter } from '@sales/http/routes/sales.routes'

// OData routes
import { companiesODataRouter } from '@companies/http/routes/companiesOData.routes'
import { categoriesODataRouter } from '@categories/http/routes/categoriesOData.routes'
import { productsODataRouter } from '@products/http/routes/productsOData.routes'
import { salesODataRouter } from '@sales/http/routes/salesOData.routes'
import { inventoryODataRouter } from '@inventory/http/routes/inventoryOData.routes'
import { taxesODataRouter } from '@taxs/http/routes/taxesOData.routes'
import { usersODataRouter } from '@users/http/routes/usersOData.routes'

const routes = Router()

// Health check route
routes.get('/', (request, response) => {
  response.json({
    message: 'e-Estoque API Node.js',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// API routes
routes.use('/roles', rolesRouter)
routes.use('/companies', companiesRouter)
routes.use('/categories', categoriesRouter)
routes.use('/products', productsRouter)
routes.use('/customers', simpleCustomersRouter)
routes.use('/sales', salesRouter)

// OData API routes
routes.use('/companies', companiesODataRouter)
routes.use('/categories', categoriesODataRouter)
routes.use('/products', productsODataRouter)
routes.use('/sales', salesODataRouter)
routes.use('/inventory', inventoryODataRouter)
routes.use('/taxes', taxesODataRouter)
routes.use('/users', usersODataRouter)

export { routes }