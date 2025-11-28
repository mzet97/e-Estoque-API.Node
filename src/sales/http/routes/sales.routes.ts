import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'
import { 
  createSaleValidation, 
  updateSaleValidation, 
  listSalesValidation,
  processPaymentValidation,
  cancelSaleValidation,
  getSaleDetailsValidation 
} from '../../validations/saleValidation'
import CreateSaleController from '../controllers/CreateSaleController'
import GetSaleDetailsController from '../controllers/GetSaleDetailsController'
import ProcessPaymentController from '../controllers/ProcessPaymentController'
import CancelSaleController from '../controllers/CancelSaleController'
import ListSalesController from '../controllers/ListSalesController'
import UpdateSaleController from '../controllers/UpdateSaleController'
import DeleteSaleController from '../controllers/DeleteSaleController'
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const salesRouter = Router()

// Controllers instances
const createSaleController = new CreateSaleController()
const getSaleDetailsController = new GetSaleDetailsController()
const processPaymentController = new ProcessPaymentController()
const cancelSaleController = new CancelSaleController()
const listSalesController = new ListSalesController()
const updateSaleController = new UpdateSaleController()
const deleteSaleController = new DeleteSaleController()

// Apply authentication to all routes
salesRouter.use(authenticateJWT)

// GET /sales - List all sales with filters
salesRouter.get(
  '/',
  listSalesValidation,
  listSalesController.handle.bind(listSalesController)
)

// GET /sales/:id - Get specific sale details
salesRouter.get(
  '/:id',
  getSaleDetailsValidation,
  getSaleDetailsController.handle.bind(getSaleDetailsController)
)

// POST /sales - Create new sale (requires 'Create' role)
salesRouter.post(
  '/',
  requireRole(['Create', 'Update', 'Admin']),
  createSaleValidation,
  createSaleController.handle.bind(createSaleController)
)

// PUT /sales/:id - Update sale (requires 'Update' role)
salesRouter.put(
  '/:id',
  requireRole(['Update', 'Admin']),
  updateSaleValidation,
  updateSaleController.handle.bind(updateSaleController)
)

// POST /sales/:id/process-payment - Process payment for sale (requires 'Update' role)
salesRouter.post(
  '/:id/process-payment',
  requireRole(['Update', 'Admin']),
  processPaymentValidation,
  (req, res) => {
    processPaymentController.handle(req, res)
  }
)

// POST /sales/:id/cancel - Cancel sale (requires 'Update' role)
salesRouter.post(
  '/:id/cancel',
  requireRole(['Update', 'Admin']),
  cancelSaleValidation,
  (req, res) => {
    cancelSaleController.handle(req, res)
  }
)

// DELETE /sales/:id - Soft delete sale (requires 'Delete' role)
salesRouter.delete(
  '/:id',
  requireRole(['Delete', 'Admin']),
  deleteSaleController.handle.bind(deleteSaleController)
)

export { salesRouter }