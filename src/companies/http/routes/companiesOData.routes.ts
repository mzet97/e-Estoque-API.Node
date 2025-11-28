import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listCompaniesValidation,
  companyIdValidation
} from '../../validations/companyValidation'

// Import controllers
import ListCompaniesODataController from '../controllers/ListCompaniesODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const companiesODataRouter = Router()

// Create controller instance
const listCompaniesODataController = new ListCompaniesODataController()

// Apply authentication to all routes
companiesODataRouter.use(authenticateJWT)

// Apply OData middleware
companiesODataRouter.use(ODataMiddleware.execute)

// GET /companies/odata - List all companies with OData support
companiesODataRouter.get(
  '/',
  listCompaniesValidation,
  listCompaniesODataController.handle.bind(listCompaniesODataController)
)

export { companiesODataRouter }
