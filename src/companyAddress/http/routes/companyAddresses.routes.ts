import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createCompanyAddressValidation,
  updateCompanyAddressValidation,
  listCompanyAddressesValidation,
  companyAddressIdValidation,
  getCompanyAddressValidation
} from '../../validations/companyAddressValidation'

// Import controllers
import CreateCompanyAddressController from '../controllers/CreateCompanyAddressController'
import UpdateCompanyAddressController from '../controllers/UpdateCompanyAddressController'
import GetCompanyAddressController from '../controllers/GetCompanyAddressController'
import ListCompanyAddressesController from '../controllers/ListCompanyAddressesController'
import DeleteCompanyAddressController from '../controllers/DeleteCompanyAddressController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const companyAddressesRouter = Router()

// Controllers instances
const createCompanyAddressController = new CreateCompanyAddressController()
const updateCompanyAddressController = new UpdateCompanyAddressController()
const getCompanyAddressController = new GetCompanyAddressController()
const listCompanyAddressesController = new ListCompanyAddressesController()
const deleteCompanyAddressController = new DeleteCompanyAddressController()

// Apply authentication to all routes
companyAddressesRouter.use(authenticateJWT)

// Routes

// GET /company-addresses - List all company addresses with filters
companyAddressesRouter.get(
  '/',
  listCompanyAddressesValidation,
  listCompanyAddressesController.handle.bind(listCompanyAddressesController)
)

// GET /company-addresses/:id - Get specific company address
companyAddressesRouter.get(
  '/:id',
  getCompanyAddressValidation,
  getCompanyAddressController.handle.bind(getCompanyAddressController)
)

// POST /company-addresses - Create new company address (requires 'Create' role)
companyAddressesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createCompanyAddressValidation,
  createCompanyAddressController.handle.bind(createCompanyAddressController)
)

// PUT /company-addresses/:id - Update company address (requires 'Update' role)
companyAddressesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateCompanyAddressValidation,
  updateCompanyAddressController.handle.bind(updateCompanyAddressController)
)

// DELETE /company-addresses/:id - Soft delete company address (requires 'Delete' role)
companyAddressesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  companyAddressIdValidation,
  deleteCompanyAddressController.handle.bind(deleteCompanyAddressController)
)

export { companyAddressesRouter }