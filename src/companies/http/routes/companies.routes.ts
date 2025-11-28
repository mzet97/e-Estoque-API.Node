import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createCompanyValidation,
  updateCompanyValidation,
  listCompaniesValidation,
  companyIdValidation,
  findByDocIdValidation,
  findByEmailValidation
} from '../../validations/companyValidation'

// Import controllers
import CreateCompanyController from '../controllers/CreateCompanyController'
import UpdateCompanyController from '../controllers/UpdateCompanyController'
import GetCompanyController from '../controllers/GetCompanyController'
import ListCompaniesController from '../controllers/ListCompaniesController'
import DeleteCompanyController from '../controllers/DeleteCompanyController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const companiesRouter = Router()

// Controllers instances
const createCompanyController = new CreateCompanyController()
const updateCompanyController = new UpdateCompanyController()
const getCompanyController = new GetCompanyController()
const listCompaniesController = new ListCompaniesController()
const deleteCompanyController = new DeleteCompanyController()

// Apply authentication to all routes
companiesRouter.use(authenticateJWT)

// Routes

// GET /companies - List all companies with filters
companiesRouter.get(
  '/',
  listCompaniesValidation,
  listCompaniesController.handle.bind(listCompaniesController)
)

// GET /companies/:id - Get specific company
companiesRouter.get(
  '/:id',
  companyIdValidation,
  getCompanyController.handle.bind(getCompanyController)
)

// POST /companies - Create new company (requires 'Create' role)
companiesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createCompanyValidation,
  createCompanyController.handle.bind(createCompanyController)
)

// PUT /companies/:id - Update company (requires 'Update' role)
companiesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateCompanyValidation,
  updateCompanyController.handle.bind(updateCompanyController)
)

// DELETE /companies/:id - Soft delete company (requires 'Delete' role)
companiesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  companyIdValidation,
  deleteCompanyController.handle.bind(deleteCompanyController)
)

export { companiesRouter }
