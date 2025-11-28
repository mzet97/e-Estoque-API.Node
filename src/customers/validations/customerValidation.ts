import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de customer
export const createCustomerValidation = celebrate({
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
    
    docId: Joi.string()
      .pattern(/^[\d\.\-\/]+$/)
      .min(11)
      .max(18)
      .required()
      .messages({
        'string.empty': 'DocId é obrigatório',
        'string.pattern.base': 'DocId deve conter apenas números, pontos, hífens e barras',
        'string.min': 'DocId deve ter pelo menos 11 caracteres (CPF)',
        'string.max': 'DocId deve ter no máximo 18 caracteres (CNPJ)',
        'any.required': 'DocId é obrigatório'
      }),
    
    email: Joi.string()
      .email()
      .min(5)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Email é obrigatório',
        'string.email': 'Email deve ser válido',
        'string.min': 'Email deve ter pelo menos 5 caracteres',
        'string.max': 'Email deve ter no máximo 255 caracteres',
        'any.required': 'Email é obrigatório'
      }),
    
    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 5000 caracteres'
      }),

    shortDescription: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'ShortDescription deve ter no máximo 500 caracteres'
      }),
    
    phoneNumber: Joi.string()
      .pattern(/^[\d\-\(\)\s\+]+$/)
      .min(10)
      .max(20)
      .allow('', null)
      .messages({
        'string.pattern.base': 'PhoneNumber deve conter apenas números, hífens, parênteses e espaços',
        'string.min': 'PhoneNumber deve ter pelo menos 10 caracteres',
        'string.max': 'PhoneNumber deve ter no máximo 20 caracteres'
      }),
    
    customerAddress: Joi.object({
      street: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
          'string.empty': 'Street é obrigatório',
          'string.min': 'Street deve ter pelo menos 2 caracteres',
          'string.max': 'Street deve ter no máximo 255 caracteres'
        }),
      
      number: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
          'string.empty': 'Number é obrigatório',
          'string.min': 'Number deve ter pelo menos 1 caractere',
          'string.max': 'Number deve ter no máximo 20 caracteres'
        }),
      
      city: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.empty': 'City é obrigatório',
          'string.min': 'City deve ter pelo menos 2 caracteres',
          'string.max': 'City deve ter no máximo 100 caracteres'
        }),
      
      state: Joi.string()
        .length(2)
        .pattern(/^[A-Z]{2}$/)
        .required()
        .messages({
          'string.empty': 'State é obrigatório',
          'string.length': 'State deve ter exatamente 2 caracteres (UF)',
          'string.pattern.base': 'State deve ser uma UF válida (ex: SP, RJ, MG)'
        }),
      
      zipCode: Joi.string()
        .pattern(/^\d{5}-?\d{3}$/)
        .required()
        .messages({
          'string.empty': 'ZipCode é obrigatório',
          'string.pattern.base': 'ZipCode deve estar no formato 00000-000 ou 00000000'
        }),
      
      country: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.empty': 'Country é obrigatório',
          'string.min': 'Country deve ter pelo menos 2 caracteres',
          'string.max': 'Country deve ter no máximo 100 caracteres'
        }),
      
      complement: Joi.string()
        .max(255)
        .allow('', null)
        .messages({
          'string.max': 'Complement deve ter no máximo 255 caracteres'
        }),
      
      neighborhood: Joi.string()
        .min(2)
        .max(100)
        .allow('', null)
        .messages({
          'string.min': 'Neighborhood deve ter pelo menos 2 caracteres',
          'string.max': 'Neighborhood deve ter no máximo 100 caracteres'
        })
    }).optional()
  })
})

// Schema para atualização de customer
export const updateCustomerValidation = celebrate({
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
    
    docId: Joi.string()
      .pattern(/^[\d\.\-\/]+$/)
      .min(11)
      .max(18)
      .messages({
        'string.pattern.base': 'DocId deve conter apenas números, pontos, hífens e barras',
        'string.min': 'DocId deve ter pelo menos 11 caracteres (CPF)',
        'string.max': 'DocId deve ter no máximo 18 caracteres (CNPJ)'
      }),
    
    email: Joi.string()
      .email()
      .min(5)
      .max(255)
      .messages({
        'string.email': 'Email deve ser válido',
        'string.min': 'Email deve ter pelo menos 5 caracteres',
        'string.max': 'Email deve ter no máximo 255 caracteres'
      }),
    
    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 5000 caracteres'
      }),

    shortDescription: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'ShortDescription deve ter no máximo 500 caracteres'
      }),
    
    phoneNumber: Joi.string()
      .pattern(/^[\d\-\(\)\s\+]+$/)
      .min(10)
      .max(20)
      .allow('', null)
      .messages({
        'string.pattern.base': 'PhoneNumber deve conter apenas números, hífens, parênteses e espaços',
        'string.min': 'PhoneNumber deve ter pelo menos 10 caracteres',
        'string.max': 'PhoneNumber deve ter no máximo 20 caracteres'
      }),
    
    customerAddress: Joi.object({
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
      
      city: Joi.string()
        .min(2)
        .max(100)
        .messages({
          'string.min': 'City deve ter pelo menos 2 caracteres',
          'string.max': 'City deve ter no máximo 100 caracteres'
        }),
      
      state: Joi.string()
        .length(2)
        .pattern(/^[A-Z]{2}$/)
        .messages({
          'string.length': 'State deve ter exatamente 2 caracteres (UF)',
          'string.pattern.base': 'State deve ser uma UF válida (ex: SP, RJ, MG)'
        }),
      
      zipCode: Joi.string()
        .pattern(/^\d{5}-?\d{3}$/)
        .messages({
          'string.pattern.base': 'ZipCode deve estar no formato 00000-000 ou 00000000'
        }),
      
      country: Joi.string()
        .min(2)
        .max(100)
        .messages({
          'string.min': 'Country deve ter pelo menos 2 caracteres',
          'string.max': 'Country deve ter no máximo 100 caracteres'
        }),
      
      complement: Joi.string()
        .max(255)
        .allow('', null)
        .messages({
          'string.max': 'Complement deve ter no máximo 255 caracteres'
        }),
      
      neighborhood: Joi.string()
        .min(2)
        .max(100)
        .allow('', null)
        .messages({
          'string.min': 'Neighborhood deve ter pelo menos 2 caracteres',
          'string.max': 'Neighborhood deve ter no máximo 100 caracteres'
        })
    }).optional()
  })
})

// Schema para busca com filtros
export const listCustomersValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    name: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Name deve ter no máximo 255 caracteres'
      }),
    
    email: Joi.string()
      .email()
      .max(255)
      .messages({
        'string.email': 'Email deve ser válido',
        'string.max': 'Email deve ter no máximo 255 caracteres'
      }),
    
    docId: Joi.string()
      .pattern(/^[\d\.\-\/]+$/)
      .max(18)
      .messages({
        'string.pattern.base': 'DocId deve conter apenas números, pontos, hífens e barras',
        'string.max': 'DocId deve ter no máximo 18 caracteres'
      }),

    phoneNumber: Joi.string()
      .pattern(/^[\d\-\(\)\s\+]+$/)
      .max(20)
      .messages({
        'string.pattern.base': 'PhoneNumber deve conter apenas números, hífens, parênteses e espaços',
        'string.max': 'PhoneNumber deve ter no máximo 20 caracteres'
      }),

    personType: Joi.string()
      .valid('FISICA', 'JURIDICA')
      .messages({
        'any.only': 'PersonType deve ser FISICA ou JURIDICA'
      }),

    hasAddress: Joi.boolean()
      .messages({
        'boolean.base': 'HasAddress deve ser um boolean'
      }),
    
    isActive: Joi.boolean()
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
      }),

    search: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Search deve ter no máximo 255 caracteres'
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
      .valid('name', 'email', 'docId', 'phoneNumber', 'createdAt')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: name, email, docId, phoneNumber, createdAt'
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
export const customerIdValidation = celebrate({
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

// Schema para busca por documento
export const findByDocIdValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    docId: Joi.string()
      .pattern(/^[\d\.\-\/]+$/)
      .min(11)
      .max(18)
      .required()
      .messages({
        'string.pattern.base': 'DocId deve conter apenas números, pontos, hífens e barras',
        'string.min': 'DocId deve ter pelo menos 11 caracteres (CPF)',
        'string.max': 'DocId deve ter no máximo 18 caracteres (CNPJ)',
        'any.required': 'DocId é obrigatório'
      })
  })
})

// Schema para busca por email
export const findByEmailValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email deve ser válido',
        'any.required': 'Email é obrigatório'
      })
  })
})

// Schema para busca por ID (get customer)
export const getCustomerValidation = celebrate({
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
    includeAddress: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'IncludeAddress deve ser um boolean'
      })
  })
})

export default {
  createCustomerValidation,
  updateCustomerValidation,
  listCustomersValidation,
  customerIdValidation,
  findByDocIdValidation,
  findByEmailValidation,
  getCustomerValidation
}