import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createCategoryValidation,
  updateCategoryValidation,
  listCategoriesValidation,
  categoryIdValidation
} from '../../validations/categoryValidation'

// Import controllers
import CreateCategoryController from '../controllers/CreateCategoryController'
import GetCategoryController from '../controllers/GetCategoryController'
import ListCategoriesController from '../controllers/ListCategoriesController'
import UpdateCategoryController from '../controllers/UpdateCategoryController'
import DeleteCategoryController from '../controllers/DeleteCategoryController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const categoriesRouter = Router()

// Controllers instances
const createCategoryController = new CreateCategoryController()
const getCategoryController = new GetCategoryController()
const listCategoriesController = new ListCategoriesController()
const updateCategoryController = new UpdateCategoryController()
const deleteCategoryController = new DeleteCategoryController()

// Apply authentication to all routes
categoriesRouter.use(authenticateJWT)

// Routes

// GET /categories - List all categories with filters
categoriesRouter.get(
  '/',
  listCategoriesValidation,
  listCategoriesController.handle.bind(listCategoriesController)
)

// GET /categories/:id - Get specific category
categoriesRouter.get(
  '/:id',
  categoryIdValidation,
  getCategoryController.handle.bind(getCategoryController)
)

// POST /categories - Create new category (requires 'Create' role)
categoriesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createCategoryValidation,
  createCategoryController.handle.bind(createCategoryController)
)

// PUT /categories/:id - Update category (requires 'Update' role)
categoriesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateCategoryValidation,
  updateCategoryController.handle.bind(updateCategoryController)
)

// DELETE /categories/:id - Soft delete category (requires 'Delete' role)
categoriesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  categoryIdValidation,
  deleteCategoryController.handle.bind(deleteCategoryController)
)

export { categoriesRouter }
