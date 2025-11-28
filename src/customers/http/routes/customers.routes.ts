import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createCustomerValidation,
  updateCustomerValidation,
  listCustomersValidation,
  customerIdValidation,
  getCustomerValidation,
  findByDocIdValidation,
  findByEmailValidation
} from '../../validations/customerValidation'

// Import controllers
import CreateCustomerController from '../controllers/CreateCustomerController'
import UpdateCustomerController from '../controllers/UpdateCustomerController'
import GetCustomerController from '../controllers/GetCustomerController'
import ListCustomersController from '../controllers/ListCustomersController'
import DeleteCustomerController from '../controllers/DeleteCustomerController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const customersRouter = Router()

// Controllers instances
const createCustomerController = new CreateCustomerController()
const updateCustomerController = new UpdateCustomerController()
const getCustomerController = new GetCustomerController()
const listCustomersController = new ListCustomersController()
const deleteCustomerController = new DeleteCustomerController()

// Apply authentication to all routes
customersRouter.use(authenticateJWT)

// Routes

// GET /customers - List all customers with filters
customersRouter.get(
  '/',
  listCustomersValidation,
  listCustomersController.handle.bind(listCustomersController)
)

// GET /customers/:id - Get specific customer
customersRouter.get(
  '/:id',
  customerIdValidation,
  getCustomerController.handle.bind(getCustomerController)
)

// POST /customers - Create new customer (requires 'Create' role)
customersRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createCustomerValidation,
  createCustomerController.handle.bind(createCustomerController)
)

// PUT /customers/:id - Update customer (requires 'Update' role)
customersRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateCustomerValidation,
  updateCustomerController.handle.bind(updateCustomerController)
)

// DELETE /customers/:id - Soft delete customer (requires 'Delete' role)
customersRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  customerIdValidation,
  deleteCustomerController.handle.bind(deleteCustomerController)
)

export { customersRouter }