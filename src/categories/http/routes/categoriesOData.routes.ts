import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listCategoriesValidation,
  categoryIdValidation
} from '../../validations/categoryValidation'

// Import controllers
import ListCategoriesODataController from '../controllers/ListCategoriesODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const categoriesODataRouter = Router()

// Create controller instance
const listCategoriesODataController = new ListCategoriesODataController()

// Apply authentication to all routes
categoriesODataRouter.use(authenticateJWT)

// Apply OData middleware
categoriesODataRouter.use(ODataMiddleware.execute)

// GET /categories/odata - List all categories with OData support
categoriesODataRouter.get(
  '/',
  listCategoriesValidation,
  listCategoriesODataController.handle.bind(listCategoriesODataController)
)

export { categoriesODataRouter }
