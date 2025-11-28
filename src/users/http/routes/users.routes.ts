import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'

// Import validation schemas
import {
  createUserValidation,
  updateUserValidation,
  listUsersValidation,
  userIdValidation,
  getUserValidation,
  unlockUserValidation
} from '../../validations/userValidation'

// Import controllers
import CreateUserController from '../controllers/CreateUserController'
import UpdateUserController from '../controllers/UpdateUserController'
import GetUserController from '../controllers/GetUserController'
import ListUsersController from '../controllers/ListUsersController'
import DeleteUserController from '../controllers/DeleteUserController'

// Import middleware
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const usersRouter = Router()

// Controllers instances
const createUserController = new CreateUserController()
const updateUserController = new UpdateUserController()
const getUserController = new GetUserController()
const listUsersController = new ListUsersController()
const deleteUserController = new DeleteUserController()

// Apply authentication to all routes
usersRouter.use(authenticateJWT)

// Routes

// GET /users - List all users with filters
usersRouter.get(
  '/',
  listUsersValidation,
  listUsersController.handle.bind(listUsersController)
)

// GET /users/:id - Get specific user
usersRouter.get(
  '/:id',
  getUserValidation,
  getUserController.handle.bind(getUserController)
)

// POST /users - Create new user (requires 'Admin' role)
usersRouter.post(
  '/',
  requireRole(['Admin']),
  createUserValidation,
  createUserController.handle.bind(createUserController)
)

// PUT /users/:id - Update user (requires 'Admin' or 'Manager' role)
usersRouter.put(
  '/:id',
  requireRole(['Admin', 'Manager']),
  updateUserValidation,
  updateUserController.handle.bind(updateUserController)
)

// DELETE /users/:id - Soft delete user (requires 'Admin' role)
usersRouter.delete(
  '/:id',
  requireRole(['Admin']),
  userIdValidation,
  deleteUserController.handle.bind(deleteUserController)
)

export { usersRouter }