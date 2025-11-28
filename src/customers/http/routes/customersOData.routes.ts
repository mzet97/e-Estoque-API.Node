import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listCustomersValidation,
  customerIdValidation
} from '../../validations/customerValidation'

// Import controllers
import ListCustomersODataController from '../controllers/ListCustomersODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const customersODataRouter = Router()

// Create controller instance
const listCustomersODataController = new ListCustomersODataController()

// Apply authentication to all routes
customersODataRouter.use(authenticateJWT)

// Apply OData middleware
customersODataRouter.use(ODataMiddleware.execute)

// GET /customers/odata - List all customers with OData support
customersODataRouter.get(
  '/',
  listCustomersValidation,
  listCustomersODataController.handle.bind(listCustomersODataController)
)

export { customersODataRouter }
