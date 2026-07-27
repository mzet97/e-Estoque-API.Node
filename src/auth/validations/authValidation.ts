import { celebrate, Segments, Joi } from 'celebrate'

export const loginValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ser um endereço de email válido',
      'any.required': 'Email é obrigatório',
      'string.empty': 'Email não pode ser vazio'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'any.required': 'Senha é obrigatória',
      'string.empty': 'Senha não pode ser vazia'
    })
  })
})

export const refreshTokenValidation = celebrate({
  [Segments.BODY]: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token é obrigatório',
      'string.empty': 'Refresh token não pode ser vazio'
    })
  })
})
