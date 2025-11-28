import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listProductsValidation,
  productIdValidation
} from '../../validations/productValidation'

// Import controllers
import ListProductsODataController from '../controllers/ListProductsODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const productsODataRouter = Router()

// Create controller instance
const listProductsODataController = new ListProductsODataController()

// Apply authentication to all routes
productsODataRouter.use(authenticateJWT)

// Apply OData middleware
productsODataRouter.use(ODataMiddleware.execute)

// GET /products/odata - List all products with OData support
productsODataRouter.get(
  '/',
  listProductsValidation,
  listProductsODataController.handle.bind(listProductsODataController)
)

export { productsODataRouter }
