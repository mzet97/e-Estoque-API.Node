import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'
import { container } from 'tsyringe'
import CreateRoleController  from '../controllers/CreateRoleController'
import ListRolesController from '../controllers/ListRolesController'
import ShowRoleController from '../controllers/ShowRoleController'
import UpdateRoleController from '../controllers/UpdateRoleController'
import DeleteRoleController from '../controllers/DeleteRoleController'
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import { requireRole } from '@shared/http/middlewares/auth.middleware'

const rolesRouter = Router()
const createRolesController = container.resolve(CreateRoleController)
const listRolesController = container.resolve(ListRolesController)
const showRolesController = container.resolve(ShowRoleController)
const updateRolesController = container.resolve(UpdateRoleController)
const deleteRolesController = container.resolve(DeleteRoleController)

// Apply authentication to all routes
rolesRouter.use(authenticateJWT)

// POST /roles - Create new role (requires 'Admin' role)
rolesRouter.post(
  '/',
  requireRole(['Admin']),
  celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.empty': 'Name é obrigatório',
          'string.min': 'Name deve ter pelo menos 2 caracteres',
          'string.max': 'Name deve ter no máximo 100 caracteres',
          'any.required': 'Name é obrigatório'
        }),
      description: Joi.string()
        .max(500)
        .allow('', null)
        .messages({
          'string.max': 'Description deve ter no máximo 500 caracteres'
        }),
      permissions: Joi.array()
        .items(Joi.string())
        .required()
        .messages({
          'array.base': 'Permissions deve ser um array',
          'any.required': 'Permissions é obrigatório'
        })
    })
  }),
  (request, response) => {
    return createRolesController.handle(request, response)
  },
)

// GET /roles - List all roles (requires any authenticated user)
rolesRouter.get(
  '/',
  celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.base': 'Page deve ser um número',
          'number.integer': 'Page deve ser um número inteiro',
          'number.min': 'Page deve ser maior que 0'
        }),
      pageSize: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
          'number.base': 'PageSize deve ser um número',
          'number.integer': 'PageSize deve ser um número inteiro',
          'number.min': 'PageSize deve ser maior que 0',
          'number.max': 'PageSize deve ser no máximo 100'
        }),
      orderBy: Joi.string()
        .valid('name', 'createdAt')
        .default('createdAt')
        .messages({
          'any.only': 'OrderBy deve ser um dos valores: name, createdAt'
        }),
      orderDirection: Joi.string()
        .valid('ASC', 'DESC')
        .default('DESC')
        .messages({
          'any.only': 'OrderDirection deve ser ASC ou DESC'
        })
    })
  }),
  (request, response) => {
    return listRolesController.handle(request, response)
  },
)

// GET /roles/:id - Get specific role (requires any authenticated user)
rolesRouter.get(
  '/:id',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'ID deve ser um UUID válido',
          'any.required': 'ID é obrigatório'
        })
    })
  }),
  (request, response) => {
    return showRolesController.handle(request, response)
  },
)

// PUT /roles/:id - Update role (requires 'Admin' role)
rolesRouter.put(
  '/:id',
  requireRole(['Admin']),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'ID deve ser um UUID válido',
          'any.required': 'ID é obrigatório'
        })
    }),
    [Segments.BODY]: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .messages({
          'string.min': 'Name deve ter pelo menos 2 caracteres',
          'string.max': 'Name deve ter no máximo 100 caracteres'
        }),
      description: Joi.string()
        .max(500)
        .allow('', null)
        .messages({
          'string.max': 'Description deve ter no máximo 500 caracteres'
        }),
      permissions: Joi.array()
        .items(Joi.string())
        .messages({
          'array.base': 'Permissions deve ser um array'
        })
    })
  }),
  (request, response) => {
    return updateRolesController.handle(request, response)
  },
)

// DELETE /roles/:id - Soft delete role (requires 'Admin' role)
rolesRouter.delete(
  '/:id',
  requireRole(['Admin']),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'ID deve ser um UUID válido',
          'any.required': 'ID é obrigatório'
        })
    })
  }),
  (request, response) => {
    return deleteRolesController.handle(request, response)
  },
)

export { rolesRouter }
