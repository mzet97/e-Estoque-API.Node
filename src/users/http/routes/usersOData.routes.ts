import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  listUsersValidation,
  userIdValidation
} from '../../validations/userValidation'

// Import controllers
import ListUsersODataController from '../controllers/ListUsersODataController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'

const usersODataRouter = Router()

// Create controller instance
const listUsersODataController = new ListUsersODataController()

// Apply authentication to all routes
usersODataRouter.use(authenticateJWT)

// Apply OData middleware
usersODataRouter.use(ODataMiddleware.execute)

// GET /users/odata - List all users with OData support
usersODataRouter.get(
  '/',
  listUsersValidation,
  listUsersODataController.handle.bind(listUsersODataController)
)

export { usersODataRouter }
