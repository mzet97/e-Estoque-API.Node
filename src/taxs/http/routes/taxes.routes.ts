import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createTaxValidation,
  updateTaxValidation,
  listTaxesValidation,
  taxIdValidation,
  getTaxValidation
} from '../../validations/taxValidation'

// Import controllers
import CreateTaxController from '../controllers/CreateTaxController'
import UpdateTaxController from '../controllers/UpdateTaxController'
import GetTaxController from '../controllers/GetTaxController'
import ListTaxesController from '../controllers/ListTaxesController'
import DeleteTaxController from '../controllers/DeleteTaxController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const taxesRouter = Router()

// Controllers instances
const createTaxController = new CreateTaxController()
const updateTaxController = new UpdateTaxController()
const getTaxController = new GetTaxController()
const listTaxesController = new ListTaxesController()
const deleteTaxController = new DeleteTaxController()

// Apply authentication to all routes
taxesRouter.use(authenticateJWT)

// Routes

// GET /taxes - List all taxes with filters
taxesRouter.get(
  '/',
  listTaxesValidation,
  listTaxesController.handle.bind(listTaxesController)
)

// GET /taxes/:id - Get specific tax
taxesRouter.get(
  '/:id',
  getTaxValidation,
  getTaxController.handle.bind(getTaxController)
)

// POST /taxes - Create new tax (requires 'Create' role)
taxesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createTaxValidation,
  createTaxController.handle.bind(createTaxController)
)

// PUT /taxes/:id - Update tax (requires 'Update' role)
taxesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateTaxValidation,
  updateTaxController.handle.bind(updateTaxController)
)

// DELETE /taxes/:id - Soft delete tax (requires 'Delete' role)
taxesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  taxIdValidation,
  deleteTaxController.handle.bind(deleteTaxController)
)

export { taxesRouter }