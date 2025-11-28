import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listTaxesValidation,
  taxIdValidation
} from '../../validations/taxValidation'

// Import controllers
import ListTaxesODataController from '../controllers/ListTaxesODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const taxesODataRouter = Router()

// Create controller instance
const listTaxesODataController = new ListTaxesODataController()

// Apply authentication to all routes
taxesODataRouter.use(authenticateJWT)

// Apply OData middleware
taxesODataRouter.use(ODataMiddleware.execute)

// GET /taxes/odata - List all taxes with OData support
taxesODataRouter.get(
  '/',
  listTaxesValidation,
  listTaxesODataController.handle.bind(listTaxesODataController)
)

export { taxesODataRouter }
