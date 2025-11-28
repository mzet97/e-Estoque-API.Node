import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de tax
export const createTaxValidation = celebrate({
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
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 5000 caracteres'
      }),
      
    percentage: Joi.number()
      .min(0)
      .max(100)
      .precision(2)
      .required()
      .messages({
        'number.base': 'Percentage deve ser um número',
        'number.min': 'Percentage deve ser maior ou igual a 0',
        'number.max': 'Percentage deve ser menor ou igual a 100',
        'any.required': 'Percentage é obrigatório'
      }),

    idCategory: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'IdCategory é obrigatório',
        'string.guid': 'IdCategory deve ser um UUID válido',
        'any.required': 'IdCategory é obrigatório'
      }),

    isActive: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
      })
  })
})

// Schema para atualização de tax
export const updateTaxValidation = celebrate({
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
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 5000 caracteres'
      }),
      
    percentage: Joi.number()
      .min(0)
      .max(100)
      .precision(2)
      .messages({
        'number.base': 'Percentage deve ser um número',
        'number.min': 'Percentage deve ser maior ou igual a 0',
        'number.max': 'Percentage deve ser menor ou igual a 100'
      }),

    idCategory: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'IdCategory deve ser um UUID válido'
      }),

    isActive: Joi.boolean()
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
      })
  })
})

// Schema para listagem com filtros
export const listTaxesValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    name: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Name deve ter no máximo 255 caracteres'
      }),
      
    idCategory: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'IdCategory deve ser um UUID válido'
      }),

    percentage: Joi.number()
      .min(0)
      .max(100)
      .precision(2)
      .messages({
        'number.base': 'Percentage deve ser um número',
        'number.min': 'Percentage deve ser maior ou igual a 0',
        'number.max': 'Percentage deve ser menor ou igual a 100'
      }),

    isActive: Joi.boolean()
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
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
      .valid('name', 'percentage', 'createdAt')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: name, percentage, createdAt'
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
export const taxIdValidation = celebrate({
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

// Schema para buscar imposto (get tax)
export const getTaxValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID deve ser um UUID válido',
        'any.required': 'ID é obrigatório'
      })
  }),
  
  [Segments.QUERY]: Joi.object({
    includeCategory: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'IncludeCategory deve ser um boolean'
      })
  })
})

export default {
  createTaxValidation,
  updateTaxValidation,
  listTaxesValidation,
  taxIdValidation,
  getTaxValidation
}