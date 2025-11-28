import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listSalesValidation,
  saleIdValidation
} from '../../validations/saleValidation'

// Import controllers
import ListSalesODataController from '../controllers/ListSalesODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const salesODataRouter = Router()

// Create controller instance
const listSalesODataController = new ListSalesODataController()

// Apply authentication to all routes
salesODataRouter.use(authenticateJWT)

// Apply OData middleware
salesODataRouter.use(ODataMiddleware.execute)

// GET /sales/odata - List all sales with OData support
salesODataRouter.get(
  '/',
  listSalesValidation,
  listSalesODataController.handle.bind(listSalesODataController)
)

export { salesODataRouter }
