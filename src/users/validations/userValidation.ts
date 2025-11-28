import { celebrate, Joi, Segments } from 'celebrate'

// Schema para criação de user
export const createUserValidation = celebrate({
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

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.empty': 'Password é obrigatório',
        'string.min': 'Password deve ter pelo menos 8 caracteres',
        'string.max': 'Password deve ter no máximo 128 caracteres',
        'string.pattern.base': 'Password deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial',
        'any.required': 'Password é obrigatório'
      }),
    
    firstName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'FirstName é obrigatório',
        'string.min': 'FirstName deve ter pelo menos 2 caracteres',
        'string.max': 'FirstName deve ter no máximo 100 caracteres',
        'any.required': 'FirstName é obrigatório'
      }),
    
    lastName: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'LastName deve ter no máximo 100 caracteres'
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
    
    roleId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'RoleId é obrigatório',
        'string.guid': 'RoleId deve ser um UUID válido',
        'any.required': 'RoleId é obrigatório'
      }),

    avatarUrl: Joi.string()
      .uri()
      .max(500)
      .allow('', null)
      .messages({
        'string.uri': 'AvatarUrl deve ser uma URL válida',
        'string.max': 'AvatarUrl deve ter no máximo 500 caracteres'
      })
  })
})

// Schema para atualização de user
export const updateUserValidation = celebrate({
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
    
    firstName: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'FirstName deve ter pelo menos 2 caracteres',
        'string.max': 'FirstName deve ter no máximo 100 caracteres'
      }),
    
    lastName: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'LastName deve ter no máximo 100 caracteres'
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
    
    roleId: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'RoleId deve ser um UUID válido'
      }),

    avatarUrl: Joi.string()
      .uri()
      .max(500)
      .allow('', null)
      .messages({
        'string.uri': 'AvatarUrl deve ser uma URL válida',
        'string.max': 'AvatarUrl deve ter no máximo 500 caracteres'
      })
  })
})

// Schema para mudança de senha
export const changePasswordValidation = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'CurrentPassword é obrigatório',
        'any.required': 'CurrentPassword é obrigatório'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.empty': 'NewPassword é obrigatório',
        'string.min': 'NewPassword deve ter pelo menos 8 caracteres',
        'string.max': 'NewPassword deve ter no máximo 128 caracteres',
        'string.pattern.base': 'NewPassword deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial',
        'any.required': 'NewPassword é obrigatório'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'ConfirmPassword deve ser igual ao NewPassword',
        'string.empty': 'ConfirmPassword é obrigatório',
        'any.required': 'ConfirmPassword é obrigatório'
      })
  })
})

// Schema para reset de senha
export const resetPasswordValidation = celebrate({
  [Segments.BODY]: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Token é obrigatório',
        'any.required': 'Token é obrigatório'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.empty': 'NewPassword é obrigatório',
        'string.min': 'NewPassword deve ter pelo menos 8 caracteres',
        'string.max': 'NewPassword deve ter no máximo 128 caracteres',
        'string.pattern.base': 'NewPassword deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial',
        'any.required': 'NewPassword é obrigatório'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'ConfirmPassword deve ser igual ao NewPassword',
        'string.empty': 'ConfirmPassword é obrigatório',
        'any.required': 'ConfirmPassword é obrigatório'
      })
  })
})

// Schema para solicitação de reset de senha
export const forgotPasswordValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email é obrigatório',
        'string.email': 'Email deve ser válido',
        'any.required': 'Email é obrigatório'
      })
  })
})

// Schema para verificação de email
export const verifyEmailValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Token é obrigatório',
        'any.required': 'Token é obrigatório'
      })
  })
})

// Schema para reenvio de verificação de email
export const resendEmailVerificationValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email é obrigatório',
        'string.email': 'Email deve ser válido',
        'any.required': 'Email é obrigatório'
      })
  })
})

// Schema para listagem com filtros
export const listUsersValidation = celebrate({
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
    
    firstName: Joi.string()
      .max(100)
      .messages({
        'string.max': 'FirstName deve ter no máximo 100 caracteres'
      }),

    lastName: Joi.string()
      .max(100)
      .messages({
        'string.max': 'LastName deve ter no máximo 100 caracteres'
      }),

    phoneNumber: Joi.string()
      .pattern(/^[\d\-\(\)\s\+]+$/)
      .max(20)
      .messages({
        'string.pattern.base': 'PhoneNumber deve conter apenas números, hífens, parênteses e espaços',
        'string.max': 'PhoneNumber deve ter no máximo 20 caracteres'
      }),

    roleId: Joi.string()
      .uuid()
      .messages({
        'string.guid': 'RoleId deve ser um UUID válido'
      }),

    isActive: Joi.boolean()
      .messages({
        'boolean.base': 'IsActive deve ser um boolean'
      }),

    isVerified: Joi.boolean()
      .messages({
        'boolean.base': 'IsVerified deve ser um boolean'
      }),

    hasAvatar: Joi.boolean()
      .messages({
        'boolean.base': 'HasAvatar deve ser um boolean'
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
      .valid('name', 'email', 'firstName', 'lastName', 'createdAt', 'lastLoginAt')
      .default('createdAt')
      .messages({
        'any.only': 'OrderBy deve ser um dos valores: name, email, firstName, lastName, createdAt, lastLoginAt'
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
export const userIdValidation = celebrate({
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

// Schema para unlock de usuário
export const unlockUserValidation = celebrate({
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

// Schema para busca de usuário (get user)
export const getUserValidation = celebrate({
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
    includeRole: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'IncludeRole deve ser um boolean'
      })
  })
})

export default {
  createUserValidation,
  updateUserValidation,
  changePasswordValidation,
  resetPasswordValidation,
  forgotPasswordValidation,
  verifyEmailValidation,
  resendEmailVerificationValidation,
  listUsersValidation,
  userIdValidation,
  unlockUserValidation,
  getUserValidation
}