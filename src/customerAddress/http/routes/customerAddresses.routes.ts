import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createCustomerAddressValidation,
  updateCustomerAddressValidation,
  listCustomerAddressesValidation,
  customerAddressIdValidation,
  getCustomerAddressValidation
} from '../../validations/customerAddressValidation'

// Import controllers
import CreateCustomerAddressController from '../controllers/CreateCustomerAddressController'
import UpdateCustomerAddressController from '../controllers/UpdateCustomerAddressController'
import GetCustomerAddressController from '../controllers/GetCustomerAddressController'
import ListCustomerAddressesController from '../controllers/ListCustomerAddressesController'
import DeleteCustomerAddressController from '../controllers/DeleteCustomerAddressController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const customerAddressesRouter = Router()

// Controllers instances
const createCustomerAddressController = new CreateCustomerAddressController()
const updateCustomerAddressController = new UpdateCustomerAddressController()
const getCustomerAddressController = new GetCustomerAddressController()
const listCustomerAddressesController = new ListCustomerAddressesController()
const deleteCustomerAddressController = new DeleteCustomerAddressController()

// Apply authentication to all routes
customerAddressesRouter.use(authenticateJWT)

// Routes

// GET /customer-addresses - List all customer addresses with filters
customerAddressesRouter.get(
  '/',
  listCustomerAddressesValidation,
  listCustomerAddressesController.handle.bind(listCustomerAddressesController)
)

// GET /customer-addresses/:id - Get specific customer address
customerAddressesRouter.get(
  '/:id',
  getCustomerAddressValidation,
  getCustomerAddressController.handle.bind(getCustomerAddressController)
)

// POST /customer-addresses - Create new customer address (requires 'Create' role)
customerAddressesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createCustomerAddressValidation,
  createCustomerAddressController.handle.bind(createCustomerAddressController)
)

// PUT /customer-addresses/:id - Update customer address (requires 'Update' role)
customerAddressesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateCustomerAddressValidation,
  updateCustomerAddressController.handle.bind(updateCustomerAddressController)
)

// DELETE /customer-addresses/:id - Soft delete customer address (requires 'Delete' role)
customerAddressesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  customerAddressIdValidation,
  deleteCustomerAddressController.handle.bind(deleteCustomerAddressController)
)

export { customerAddressesRouter }