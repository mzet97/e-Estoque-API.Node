import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import controllers
import CreateProductController from '../controllers/CreateProductController'
import GetProductController from '../controllers/GetProductController'
import ListProductsController from '../controllers/ListProductsController'
import UpdateProductController from '../controllers/UpdateProductController'
import DeleteProductController from '../controllers/DeleteProductController

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

// Import validations
import { productValidation } from '../../validations/productValidation'

const productsRouter = Router()

// Controllers instances
const createProductController = new CreateProductController()
const getProductController = new GetProductController()
const listProductsController = new ListProductsController()
const updateProductController = new UpdateProductController()
const deleteProductController = new DeleteProductController()

// Apply authentication to all routes
productsRouter.use(authenticateJWT)

// Routes

// GET /products - List all products with filters
productsRouter.get(
  '/',
  listProductsController.handle.bind(listProductsController)
)

// GET /products/:id - Get specific product
productsRouter.get(
  '/:id',
  celebrate({ 
    [Segments.PARAMS]: {
      id: productValidation.id
    }
  }),
  getProductController.handle.bind(getProductController)
)

// POST /products - Create new product (requires 'Create' role)
productsRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  productValidation.create,
  createProductController.handle.bind(createProductController)
)

// PUT /products/:id - Update product (requires 'Update' role)
productsRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  celebrate({ 
    [Segments.PARAMS]: {
      id: productValidation.id
    },
    [Segments.BODY]: productValidation.update
  }),
  updateProductController.handle.bind(updateProductController)
)

// DELETE /products/:id - Soft delete product (requires 'Delete' role)
productsRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  celebrate({ 
    [Segments.PARAMS]: {
      id: productValidation.id
    }
  }),
  deleteProductController.handle.bind(deleteProductController)
)

export { productsRouter }
