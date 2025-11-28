import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de product
export const createProductValidation = celebrate({
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
      .max(2000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 2000 caracteres'
      }),
      
    shortDescription: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'ShortDescription deve ter no máximo 500 caracteres'
      }),
      
    sku: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'SKU deve ter no máximo 50 caracteres',
      }),
      
    price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Price deve ser um número positivo',
        'any.required': 'Price é obrigatório'
      }),
      
    cost: Joi.number()
      .positive()
      .precision(2)
      .allow(null)
      .messages({
        'number.positive': 'Cost deve ser um número positivo'
      }),
      
    weight: Joi.number()
      .positive()
      .precision(3)
      .allow(null)
      .messages({
        'number.positive': 'Weight deve ser um número positivo'
      }),
      
    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.integer': 'StockQuantity deve ser um número inteiro',
        'number.min': 'StockQuantity deve ser maior ou igual a 0'
      }),
      
    minStockLevel: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.integer': 'MinStockLevel deve ser um número inteiro',
        'number.min': 'MinStockLevel deve ser maior ou igual a 0'
      }),
      
    
    categoryId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'CategoryId deve ser um UUID válido',
      }),
    
    companyId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'CompanyId deve ser um UUID válido',
        'any.required': 'CompanyId é obrigatório'
      }),
    
    maxStockLevel: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.integer': 'MaxStockLevel deve ser um número inteiro',
        'number.min': 'MaxStockLevel deve ser maior ou igual a 0'
      }),
    
    depth: Joi.number()
      .positive()
      .precision(3)
      .optional()
      .messages({
        'number.positive': 'Depth deve ser um número positivo'
      }),
      
    grossWeight: Joi.number()
      .positive()
      .precision(3)
      .optional()
      .messages({
        'number.positive': 'GrossWeight deve ser um número positivo'
      }),
    
    imageUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'ImageUrl deve ser uma URL válida'
      }),
      
    imageAltText: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'ImageAltText deve ter no máximo 255 caracteres'
      }),
      
    isActive: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
      }),
      
    isFeatured: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'IsFeatured deve ser um boolean'
      }),
      
    isDigital: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'IsDigital deve ser um boolean'
      }),
      
    slug: Joi.string()
      .alphanum()
      .min(3)
      .max(100)
      .optional()
      .messages({
        'string.alphanum': 'Slug deve conter apenas letras e números',
        'string.min': 'Slug deve ter pelo menos 3 caracteres',
        'string.max': 'Slug deve ter no máximo 100 caracteres'
      }),
      
    metaTitle: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'MetaTitle deve ter no máximo 255 caracteres'
      }),
      
    metaDescription: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'MetaDescription deve ter no máximo 500 caracteres'
      }),
      
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .messages({
        'array.max': 'Images deve ter no máximo 10 URLs',
        'string.uri': 'Cada imagem deve ser uma URL válida'
      }),
      
    dimensions: Joi.object({
      length: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Length deve ser um número positivo'
        }),
        
      width: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Width deve ser um número positivo'
        }),
        
      height: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Height deve ser um número positivo'
        })
      })
      .messages({
        'object.base': 'Dimensions deve ser um objeto válido'
      })
  })
})

// Schema para atualização de product
export const updateProductValidation = celebrate({
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
      .max(2000)
      .allow('', null)
      .messages({
        'string.max': 'Description deve ter no máximo 2000 caracteres'
      }),
      
    shortDescription: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'ShortDescription deve ter no máximo 500 caracteres'
      }),
      
    sku: Joi.string()
      .max(50)
      .messages({
        'string.max': 'SKU deve ter no máximo 50 caracteres'
      }),
      
    price: Joi.number()
      .positive()
      .precision(2)
      .messages({
        'number.positive': 'Price deve ser um número positivo'
      }),
      
    cost: Joi.number()
      .positive()
      .precision(2)
      .allow(null)
      .messages({
        'number.positive': 'Cost deve ser um número positivo'
      }),
      
    weight: Joi.number()
      .positive()
      .precision(3)
      .allow(null)
      .messages({
        'number.positive': 'Weight deve ser um número positivo'
      }),
      
    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .messages({
        'number.integer': 'StockQuantity deve ser um número inteiro',
        'number.min': 'StockQuantity deve ser maior ou igual a 0'
      }),
      
    minStockLevel: Joi.number()
      .integer()
      .min(0)
      .messages({
        'number.integer': 'MinStockLevel deve ser um número inteiro',
        'number.min': 'MinStockLevel deve ser maior ou igual a 0'
      }),
      
    categoryId: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'CategoryId deve ser um UUID válido'
      }),
      
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .messages({
        'array.max': 'Images deve ter no máximo 10 URLs',
        'string.uri': 'Cada imagem deve ser uma URL válida'
      }),
      
    dimensions: Joi.object({
      length: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Length deve ser um número positivo'
        }),
        
      width: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Width deve ser um número positivo'
        }),
        
      height: Joi.number()
        .positive()
        .precision(3)
        .messages({
          'number.positive': 'Height deve ser um número positivo'
        })
      })
      .messages({
        'object.base': 'Dimensions deve ser um objeto válido'
      })
  })
})

// Schema para listagem com filtros
export const listProductsValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    name: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Name deve ter no máximo 255 caracteres'
      }),
      
    description: Joi.string()
      .max(255)
      .messages({
        'string.max': 'Description deve ter no máximo 255 caracteres'
      }),
      
    sku: Joi.string()
      .max(50)
      .messages({
        'string.max': 'SKU deve ter no máximo 50 caracteres'
      }),
      
    categoryId: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'CategoryId deve ser um UUID válido'
      }),
      
    minPrice: Joi.number()
      .positive()
      .messages({
        'number.positive': 'MinPrice deve ser um número positivo'
      }),
      
    maxPrice: Joi.number()
      .positive()
      .messages({
        'number.positive': 'MaxPrice deve ser um número positivo'
      }),
      
    inStock: Joi.boolean()
      .messages({
        'boolean.base': 'InStock deve ser um boolean'
      }),
      
    lowStock: Joi.boolean()
      .messages({
        'boolean.base': 'LowStock deve ser um boolean'
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
      .valid('name', 'price', 'sku', 'createdAt', 'stockQuantity')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: name, price, sku, createdAt, stockQuantity'
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
export const productIdValidation = celebrate({
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
  createProductValidation,
  updateProductValidation,
  listProductsValidation,
  productIdValidation
}