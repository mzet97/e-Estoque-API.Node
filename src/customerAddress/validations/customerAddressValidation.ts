import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de customer address
export const createCustomerAddressValidation = celebrate({
  [Segments.BODY]: Joi.object({
    type: Joi.string()
      .valid('shipping', 'billing', 'residential')
      .required()
      .messages({
        'string.empty': 'Type é obrigatório',
        'any.only': 'Type deve ser uma das opções: shipping, billing, residential',
        'any.required': 'Type é obrigatório'
      }),
    
    street: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Street é obrigatório',
        'string.min': 'Street deve ter pelo menos 2 caracteres',
        'string.max': 'Street deve ter no máximo 255 caracteres',
        'any.required': 'Street é obrigatório'
      }),

    number: Joi.string()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.empty': 'Number é obrigatório',
        'string.min': 'Number deve ter pelo menos 1 caractere',
        'string.max': 'Number deve ter no máximo 20 caracteres',
        'any.required': 'Number é obrigatório'
      }),

    complement: Joi.string()
      .max(255)
      .allow('', null)
      .messages({
        'string.max': 'Complement deve ter no máximo 255 caracteres'
      }),

    neighborhood: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Neighborhood é obrigatório',
        'string.min': 'Neighborhood deve ter pelo menos 2 caracteres',
        'string.max': 'Neighborhood deve ter no máximo 255 caracteres',
        'any.required': 'Neighborhood é obrigatório'
      }),

    district: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'District é obrigatório',
        'string.min': 'District deve ter pelo menos 2 caracteres',
        'string.max': 'District deve ter no máximo 255 caracteres',
        'any.required': 'District é obrigatório'
      }),

    city: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.empty': 'City é obrigatório',
        'string.min': 'City deve ter pelo menos 2 caracteres',
        'string.max': 'City deve ter no máximo 255 caracteres',
        'any.required': 'City é obrigatório'
      }),

    state: Joi.string()
      .length(2)
      .pattern(/^[A-Z]{2}$/)
      .required()
      .messages({
        'string.empty': 'State é obrigatório',
        'string.length': 'State deve ter exatamente 2 caracteres (UF)',
        'string.pattern.base': 'State deve ser uma UF válida (ex: SP, RJ, MG)',
        'any.required': 'State é obrigatório'
      }),

    country: Joi.string()
      .min(2)
      .max(100)
      .default('Brasil')
      .messages({
        'string.min': 'Country deve ter pelo menos 2 caracteres',
        'string.max': 'Country deve ter no máximo 100 caracteres'
      }),

    zipCode: Joi.string()
      .pattern(/^\d{5}-?\d{3}$/)
      .required()
      .messages({
        'string.empty': 'ZipCode é obrigatório',
        'string.pattern.base': 'ZipCode deve estar no formato 00000-000 ou 00000000',
        'any.required': 'ZipCode é obrigatório'
      }),

    latitude: Joi.number()
      .min(-90)
      .max(90)
      .allow(null)
      .messages({
        'number.min': 'Latitude deve estar entre -90 e 90',
        'number.max': 'Latitude deve estar entre -90 e 90'
      }),

    longitude: Joi.number()
      .min(-180)
      .max(180)
      .allow(null)
      .messages({
        'number.min': 'Longitude deve estar entre -180 e 180',
        'number.max': 'Longitude deve estar entre -180 e 180'
      }),

    isDefault: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'IsDefault deve ser um boolean'
      }),

    customerId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'CustomerId é obrigatório',
        'string.guid': 'CustomerId deve ser um UUID válido',
        'any.required': 'CustomerId é obrigatório'
      })
  })
})

// Schema para atualização de customer address
export const updateCustomerAddressValidation = celebrate({
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
    type: Joi.string()
      .valid('shipping', 'billing', 'residential')
      .messages({
        'any.only': 'Type deve ser uma das opções: shipping, billing, residential'
      }),
    
    street: Joi.string()
      .min(2)
      .max(255)
      .messages({
        'string.min': 'Street deve ter pelo menos 2 caracteres',
        'string.max': 'Street deve ter no máximo 255 caracteres'
      }),

    number: Joi.string()
      .min(1)
      .max(20)
      .messages({
        'string.min': 'Number deve ter pelo menos 1 caractere',
        'string.max': 'Number deve ter no máximo 20 caracteres'
      }),

    complement: Joi.string()
      .max(255)
      .allow('', null)
      .messages({
        'string.max': 'Complement deve ter no máximo 255 caracteres'
      }),

    neighborhood: Joi.string()
      .min(2)
      .max(255)
      .messages({
        'string.min': 'Neighborhood deve ter pelo menos 2 caracteres',
        'string.max': 'Neighborhood deve ter no máximo 255 caracteres'
      }),

    district: Joi.string()
      .min(2)
      .max(255)
      .messages({
        'string.min': 'District deve ter pelo menos 2 caracteres',
        'string.max': 'District deve ter no máximo 255 caracteres'
      }),

    city: Joi.string()
      .min(2)
      .max(255)
      .messages({
        'string.min': 'City deve ter pelo menos 2 caracteres',
        'string.max': 'City deve ter no máximo 255 caracteres'
      }),

    state: Joi.string()
      .length(2)
      .pattern(/^[A-Z]{2}$/)
      .messages({
        'string.length': 'State deve ter exatamente 2 caracteres (UF)',
        'string.pattern.base': 'State deve ser uma UF válida (ex: SP, RJ, MG)'
      }),

    country: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Country deve ter pelo menos 2 caracteres',
        'string.max': 'Country deve ter no máximo 100 caracteres'
      }),

    zipCode: Joi.string()
      .pattern(/^\d{5}-?\d{3}$/)
      .messages({
        'string.pattern.base': 'ZipCode deve estar no formato 00000-000 ou 00000000'
      }),

    latitude: Joi.number()
      .min(-90)
      .max(90)
      .allow(null)
      .messages({
        'number.min': 'Latitude deve estar entre -90 e 90',
        'number.max': 'Latitude deve estar entre -90 e 90'
      }),

    longitude: Joi.number()
      .min(-180)
      .max(180)
      .allow(null)
      .messages({
        'number.min': 'Longitude deve estar entre -180 e 180',
        'number.max': 'Longitude deve estar entre -180 e 180'
      }),

    isDefault: Joi.boolean()
      .messages({
        'boolean.base': 'IsDefault deve ser um boolean'
      })
  })
})

// Schema para listagem com filtros
export const listCustomerAddressesValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    customerId: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'CustomerId deve ser um UUID válido'
      }),

    type: Joi.string()
      .valid('shipping', 'billing', 'residential')
      .messages({
        'any.only': 'Type deve ser uma das opções: shipping, billing, residential'
      }),

    city: Joi.string()
      .max(255)
      .messages({
        'string.max': 'City deve ter no máximo 255 caracteres'
      }),

    state: Joi.string()
      .length(2)
      .pattern(/^[A-Z]{2}$/)
      .messages({
        'string.length': 'State deve ter exatamente 2 caracteres (UF)',
        'string.pattern.base': 'State deve ser uma UF válida (ex: SP, RJ, MG)'
      }),

    isDefault: Joi.boolean()
      .messages({
        'boolean.base': 'IsDefault deve ser um boolean'
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
      .valid('type', 'city', 'state', 'createdAt')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: type, city, state, createdAt'
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
export const customerAddressIdValidation = celebrate({
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

// Schema para buscar endereço do cliente (get address)
export const getCustomerAddressValidation = celebrate({
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
    includeCustomer: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'IncludeCustomer deve ser um boolean'
      })
  })
})

export default {
  createCustomerAddressValidation,
  updateCustomerAddressValidation,
  listCustomerAddressesValidation,
  customerAddressIdValidation,
  getCustomerAddressValidation
}