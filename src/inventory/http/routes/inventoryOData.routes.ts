import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listInventoryValidation,
  inventoryIdValidation
} from '../../validations/inventoryValidation'

// Import controllers
import ListInventoryODataController from '../controllers/ListInventoryODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const inventoryODataRouter = Router()

// Create controller instance
const listInventoryODataController = new ListInventoryODataController()

// Apply authentication to all routes
inventoryODataRouter.use(authenticateJWT)

// Apply OData middleware
inventoryODataRouter.use(ODataMiddleware.execute)

// GET /inventory/odata - List all inventory movements with OData support
inventoryODataRouter.get(
  '/',
  listInventoryValidation,
  listInventoryODataController.handle.bind(listInventoryODataController)
)

export { inventoryODataRouter }
