import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de inventory movement
export const createInventoryMovementValidation = celebrate({
  [Segments.BODY]: Joi.object({
    productId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'ProductId é obrigatório',
        'string.guid': 'ProductId deve ser um UUID válido',
        'any.required': 'ProductId é obrigatório'
      }),

    movementType: Joi.string()
      .valid('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'RESERVATION', 'RELEASE')
      .required()
      .messages({
        'string.empty': 'MovementType é obrigatório',
        'any.only': 'MovementType deve ser um dos valores: IN, OUT, ADJUSTMENT, TRANSFER, RETURN, RESERVATION, RELEASE',
        'any.required': 'MovementType é obrigatório'
      }),

    movementReason: Joi.string()
      .max(255)
      .required()
      .messages({
        'string.empty': 'MovementReason é obrigatório',
        'string.max': 'MovementReason deve ter no máximo 255 caracteres',
        'any.required': 'MovementReason é obrigatório'
      }),

    quantity: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Quantity deve ser um número',
        'number.positive': 'Quantity deve ser maior que zero',
        'any.required': 'Quantity é obrigatório'
      }),

    unitCost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'UnitCost deve ser um número',
        'number.positive': 'UnitCost deve ser maior que zero'
      }),

    totalCost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'TotalCost deve ser um número',
        'number.positive': 'TotalCost deve ser maior que zero'
      }),

    notes: Joi.string()
      .max(1000)
      .allow('', null)
      .messages({
        'string.max': 'Notes deve ter no máximo 1000 caracteres'
      }),

    reference: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Reference deve ter no máximo 100 caracteres'
      })
  })
})

// Schema para atualização de inventory movement
export const updateInventoryMovementValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'Id é obrigatório',
        'string.guid': 'Id deve ser um UUID válido',
        'any.required': 'Id é obrigatório'
      })
  }),

  [Segments.BODY]: Joi.object({
    movementType: Joi.string()
      .valid('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'RESERVATION', 'RELEASE')
      .optional()
      .messages({
        'any.only': 'MovementType deve ser um dos valores: IN, OUT, ADJUSTMENT, TRANSFER, RETURN, RESERVATION, RELEASE'
      }),

    movementReason: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'MovementReason deve ter no máximo 255 caracteres'
      }),

    quantity: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.base': 'Quantity deve ser um número',
        'number.positive': 'Quantity deve ser maior que zero'
      }),

    unitCost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'UnitCost deve ser um número',
        'number.positive': 'UnitCost deve ser maior que zero'
      }),

    totalCost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'TotalCost deve ser um número',
        'number.positive': 'TotalCost deve ser maior que zero'
      }),

    notes: Joi.string()
      .max(1000)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Notes deve ter no máximo 1000 caracteres'
      }),

    reference: Joi.string()
      .max(100)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Reference deve ter no máximo 100 caracteres'
      })
  })
})

// Schema para listagem com filtros
export const listInventoryValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    productId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'ProductId deve ser um UUID válido'
      }),

    companyId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'CompanyId deve ser um UUID válido'
      }),

    movementType: Joi.string()
      .valid('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'RESERVATION', 'RELEASE')
      .optional()
      .messages({
        'any.only': 'MovementType deve ser um dos valores: IN, OUT, ADJUSTMENT, TRANSFER, RETURN, RESERVATION, RELEASE'
      }),

    movementReason: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'MovementReason deve ter no máximo 255 caracteres'
      }),

    quantity: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.base': 'Quantity deve ser um número',
        'number.positive': 'Quantity deve ser maior que zero'
      }),

    unitCost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'UnitCost deve ser um número',
        'number.positive': 'UnitCost deve ser maior que zero'
      }),

    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes deve ter no máximo 1000 caracteres'
      }),

    reference: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Reference deve ter no máximo 100 caracteres'
      }),

    // OData query parameters
    $filter: Joi.string()
      .optional()
      .messages({
        'string.base': '$filter deve ser uma string'
      }),

    $orderby: Joi.string()
      .optional()
      .messages({
        'string.base': '$orderby deve ser uma string'
      }),

    $top: Joi.number()
      .integer()
      .positive()
      .max(1000)
      .optional()
      .messages({
        'number.base': '$top deve ser um número',
        'number.integer': '$top deve ser um inteiro',
        'number.positive': '$top deve ser maior que zero',
        'number.max': '$top deve ser menor ou igual a 1000'
      }),

    $skip: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': '$skip deve ser um número',
        'number.integer': '$skip deve ser um inteiro',
        'number.min': '$skip deve ser maior ou igual a zero'
      }),

    $select: Joi.string()
      .optional()
      .messages({
        'string.base': '$select deve ser uma string'
      }),

    $expand: Joi.string()
      .optional()
      .messages({
        'string.base': '$expand deve ser uma string'
      }),

    $count: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': '$count deve ser um booleano'
      })
  })
})

// Schema para ID do inventory movement
export const inventoryIdValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'Id é obrigatório',
        'string.guid': 'Id deve ser um UUID válido',
        'any.required': 'Id é obrigatório'
      })
  })
})

// Schema para atualização de stock
export const updateStockValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    productId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'ProductId é obrigatório',
        'string.guid': 'ProductId deve ser um UUID válido',
        'any.required': 'ProductId é obrigatório'
      }),

    companyId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'CompanyId é obrigatório',
        'string.guid': 'CompanyId deve ser um UUID válido',
        'any.required': 'CompanyId é obrigatório'
      })
  }),

  [Segments.BODY]: Joi.object({
    operation: Joi.string()
      .valid('ADD', 'REMOVE', 'RESERVE', 'RELEASE', 'CONFIRM', 'ADJUST')
      .required()
      .messages({
        'string.empty': 'Operation é obrigatório',
        'any.only': 'Operation deve ser um dos valores: ADD, REMOVE, RESERVE, RELEASE, CONFIRM, ADJUST',
        'any.required': 'Operation é obrigatório'
      }),

    quantity: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Quantity deve ser um número',
        'number.positive': 'Quantity deve ser maior que zero',
        'any.required': 'Quantity é obrigatório'
      }),

    userId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'UserId é obrigatório',
        'string.guid': 'UserId deve ser um UUID válido',
        'any.required': 'UserId é obrigatório'
      }),

    reason: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'Reason deve ter no máximo 255 caracteres'
      }),

    referenceId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'ReferenceId deve ser um UUID válido'
      }),

    referenceType: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'ReferenceType deve ter no máximo 50 caracteres'
      }),

    unitCost: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.base': 'UnitCost deve ser um número',
        'number.positive': 'UnitCost deve ser maior que zero'
      }),

    unitPrice: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.base': 'UnitPrice deve ser um número',
        'number.positive': 'UnitPrice deve ser maior que zero'
      }),

    location: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Location deve ter no máximo 100 caracteres'
      }),

    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes deve ter no máximo 1000 caracteres'
      })
  })
})

// Schema para verificação de baixo estoque
export const checkLowStockValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    companyId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'CompanyId é obrigatório',
        'string.guid': 'CompanyId deve ser um UUID válido',
        'any.required': 'CompanyId é obrigatório'
      })
  }),

  [Segments.QUERY]: Joi.object({
    includeCritical: Joi.boolean()
      .default(false)
      .optional()
      .messages({
        'boolean.base': 'IncludeCritical deve ser um booleano'
      }),

    includeOutOfStock: Joi.boolean()
      .default(true)
      .optional()
      .messages({
        'boolean.base': 'IncludeOutOfStock deve ser um booleano'
      }),

    includeNearExpiry: Joi.boolean()
      .default(true)
      .optional()
      .messages({
        'boolean.base': 'IncludeNearExpiry deve ser um booleano'
      }),

    location: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Location deve ter no máximo 100 caracteres'
      }),

    warehouseZone: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'WarehouseZone deve ter no máximo 50 caracteres'
      })
  })
})

// Schema para listagem de estoque
export const listStockValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    companyId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'CompanyId é obrigatório',
        'string.guid': 'CompanyId deve ser um UUID válido',
        'any.required': 'CompanyId é obrigatório'
      })
  }),

  [Segments.QUERY]: Joi.object({
    productId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'ProductId deve ser um UUID válido'
      }),

    categoryId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'CategoryId deve ser um UUID válido'
      }),

    location: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Location deve ter no máximo 100 caracteres'
      }),

    warehouseZone: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'WarehouseZone deve ter no máximo 50 caracteres'
      }),

    includeOutOfStock: Joi.boolean()
      .default(false)
      .optional()
      .messages({
        'boolean.base': 'IncludeOutOfStock deve ser um booleano'
      }),

    includeLowStock: Joi.boolean()
      .default(true)
      .optional()
      .messages({
        'boolean.base': 'IncludeLowStock deve ser um booleano'
      })
  })
})

// Export all validations
export {
  createInventoryMovementValidation,
  updateInventoryMovementValidation,
  listInventoryValidation,
  inventoryIdValidation,
  updateStockValidation,
  checkLowStockValidation,
  listStockValidation
}
