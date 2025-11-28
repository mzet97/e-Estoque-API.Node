import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de category
export const createCategoryValidation = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Name é obrigatório',
        'string.min': 'Name deve ter pelo menos 2 caracteres',
        'string.max': 'Name deve ter no máximo 255 caracteres',
        'any.required': 'Name é obrigatório'
      }),
    
    description: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 500 caracteres'
      }),
      
    parentCategoryId: Joi.string()
      .uuid()
      .allow(null, '')
      .messages({
        'string.guid': 'ParentCategoryId deve ser um UUID válido'
      })
  })
})

// Schema para atualização de category
export const updateCategoryValidation = celebrate({
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
      .max(255)
      .messages({
        'string.min': 'Name deve ter pelo menos 2 caracteres',
        'string.max': 'Name deve ter no máximo 255 caracteres'
      }),
    
    description: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 500 caracteres'
      }),
      
    parentCategoryId: Joi.string()
      .uuid()
      .allow(null, '')
      .messages({
        'string.guid': 'ParentCategoryId deve ser um UUID válido'
      })
  })
})

// Schema para listagem com filtros
export const listCategoriesValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    name: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Name deve ter no máximo 255 caracteres'
      }),
      
    parentId: Joi.string()
      .uuid()
      .allow(null, '')
      .messages({
        'string.guid': 'ParentId deve ser um UUID válido'
      }),
      
    hasChildren: Joi.boolean()
      .messages({
        'boolean.base': 'HasChildren deve ser um boolean'
      }),
      
    level: Joi.number()
      .integer()
      .min(0)
      .messages({
        'number.base': 'Level deve ser um número',
        'number.integer': 'Level deve ser um número inteiro',
        'number.min': 'Level deve ser maior ou igual a 0'
      }),
      
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
      .valid('name', 'createdAt', 'level')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: name, createdAt, level'
      }),
      
    orderDirection: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
      .messages({
        'any.only': 'OrderDirection deve ser ASC ou DESC'
      })
  })
})

// Schema para parâmetros de ID
export const categoryIdValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID deve ser um UUID válido',
        'any.required': 'ID é obrigatório'
      })
  })
})

export default {
  createCategoryValidation,
  updateCategoryValidation,
  listCategoriesValidation,
  categoryIdValidation
}