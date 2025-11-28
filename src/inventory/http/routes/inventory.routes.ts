import { Router } from 'express'
import { celebrate, Segments, Joi } from 'celebrate'
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'
import UpdateStockController from '../../controllers/UpdateStockController'
import CheckLowStockController from '../../controllers/CheckLowStockController'
import ListInventoryMovementsController from '../controllers/ListInventoryMovementsController'
import ListInventoryStockController from '../controllers/ListInventoryStockController'

const inventoryRouter = Router()

// Controllers instances
const updateStockController = new UpdateStockController()
const checkLowStockController = new CheckLowStockController()
const listInventoryMovementsController = new ListInventoryMovementsController()
const listInventoryStockController = new ListInventoryStockController()

// Apply authentication to all routes
inventoryRouter.use(authenticateJWT)

// PUT /inventory/:productId/companies/:companyId/stock - Update stock for specific product
inventoryRouter.put(
  '/:productId/companies/:companyId/stock',
  requireRole(['Update', 'Admin']),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      productId: Joi.string().uuid().required(),
      companyId: Joi.string().uuid().required()
    }),
    [Segments.BODY]: Joi.object({
      operation: Joi.string().valid('ADD', 'REMOVE', 'RESERVE', 'RELEASE', 'CONFIRM', 'ADJUST').required(),
      quantity: Joi.number().positive().required(),
      userId: Joi.string().uuid().required(),
      reason: Joi.string().optional(),
      referenceId: Joi.string().uuid().optional(),
      referenceType: Joi.string().optional(),
      unitCost: Joi.number().positive().optional(),
      unitPrice: Joi.number().positive().optional(),
      location: Joi.string().max(100).optional(),
      notes: Joi.string().max(1000).optional()
    })
  }),
  (req, res) => {
    updateStockController.handle(req, res)
  }
)

// GET /inventory/companies/:companyId/low-stock - Check low stock alerts
inventoryRouter.get(
  '/companies/:companyId/low-stock',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      includeCritical: Joi.boolean().default(false),
      includeOutOfStock: Joi.boolean().default(true),
      includeNearExpiry: Joi.boolean().default(true),
      location: Joi.string().max(100).optional(),
      warehouseZone: Joi.string().max(50).optional()
    })
  }),
  (req, res) => {
    checkLowStockController.handle(req, res)
  }
)

// GET /inventory/companies/:companyId/stock - Get stock overview
inventoryRouter.get(
  '/companies/:companyId/stock',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(20),
      location: Joi.string().max(100).optional(),
      warehouseZone: Joi.string().max(50).optional(),
      isLowStock: Joi.boolean().optional(),
      isAtRiskOfStockout: Joi.boolean().optional(),
      isOutOfStock: Joi.boolean().optional(),
      needsReorder: Joi.boolean().optional(),
      abcClassification: Joi.string().valid('A', 'B', 'C').optional(),
      orderBy: Joi.string().valid('totalQuantity', 'availableQuantity', 'minStockLevel', 'totalInvestment').default('totalQuantity'),
      orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC')
    })
  }),
  listInventoryStockController.handle.bind(listInventoryStockController)
)

// GET /inventory/companies/:companyId/movements - Get inventory movements
inventoryRouter.get(
  '/companies/:companyId/movements',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      productId: Joi.string().uuid().optional(),
      movementType: Joi.string().valid('IN', 'OUT').optional(),
      movementReason: Joi.string().optional(),
      status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED').optional(),
      minDate: Joi.date().iso().optional(),
      maxDate: Joi.date().iso().optional(),
      location: Joi.string().max(100).optional(),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(20),
      orderBy: Joi.string().valid('createdAt', 'movementDate', 'quantity').default('createdAt'),
      orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC'),
      search: Joi.string().max(255).optional()
    })
  }),
  listInventoryMovementsController.handle.bind(listInventoryMovementsController)
)

// GET /inventory/companies/:companyId/statistics - Get inventory statistics
inventoryRouter.get(
  '/companies/:companyId/statistics',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional()
    })
  }),
  (req, res) => {
    // Placeholder - would implement statistics controller
    res.status(501).json({ 
      success: false, 
      message: 'Statistics endpoint not implemented yet' 
    })
  }
)

// GET /inventory/companies/:companyId/out-of-stock - Get out of stock products
inventoryRouter.get(
  '/companies/:companyId/out-of-stock',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      location: Joi.string().max(100).optional(),
      warehouseZone: Joi.string().max(50).optional(),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(20)
    })
  }),
  (req, res) => {
    // Placeholder - would implement out of stock controller
    res.status(501).json({ 
      success: false, 
      message: 'Out of stock endpoint not implemented yet' 
    })
  }
)

// GET /inventory/companies/:companyId/expired - Get expired products
inventoryRouter.get(
  '/companies/:companyId/expired',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      companyId: Joi.string().uuid().required()
    }),
    [Segments.QUERY]: Joi.object({
      daysAhead: Joi.number().integer().min(1).max(365).default(30),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(20)
    })
  }),
  (req, res) => {
    // Placeholder - would implement expired products controller
    res.status(501).json({ 
      success: false, 
      message: 'Expired products endpoint not implemented yet' 
    })
  }
)

export { inventoryRouter }