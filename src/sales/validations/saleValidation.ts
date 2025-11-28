import { celebrate, Joi, Segments } from 'celebrate'

export const createSaleValidation = celebrate({
  [Segments.BODY]: Joi.object({
    customerId: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
    saleType: Joi.string().valid('RETAIL', 'WHOLESALE', 'CONSIGNMENT', 'SERVICE', 'B2B', 'B2C', 'MARKETPLACE', 'DIRECT_SALE', 'FRANCHISE', 'PARTNERSHIP').required(),
    paymentType: Joi.string().valid('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_SLIP', 'BANK_TRANSFER', 'CHECK', 'FINANCED', 'INSTALLMENTS', 'CREDIT', 'EXCHANGE', 'LOYALTY_POINTS', 'DIGITAL_WALLET').required(),
    totalAmount: Joi.number().positive().required(),
    notes: Joi.string().allow('', null),
    internalNotes: Joi.string().allow('', null),
    paymentInstallments: Joi.number().integer().min(1).default(1),
    deliveryMethod: Joi.string().allow('', null)
  })
})

export const updateSaleValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().uuid().required()
  }),
  [Segments.BODY]: Joi.object({
    totalAmount: Joi.number().positive(),
    discountValue: Joi.number().min(0).default(0),
    taxValue: Joi.number().min(0).default(0),
    shippingValue: Joi.number().min(0).default(0),
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'),
    notes: Joi.string().allow('', null),
    internalNotes: Joi.string().allow('', null)
  })
})

export const listSalesValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    customerId: Joi.string().uuid(),
    companyId: Joi.string().uuid(),
    saleNumber: Joi.string().max(50),
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'),
    saleType: Joi.string().valid('RETAIL', 'WHOLESALE', 'CONSIGNMENT', 'SERVICE', 'B2B', 'B2C', 'MARKETPLACE', 'DIRECT_SALE', 'FRANCHISE', 'PARTNERSHIP'),
    paymentType: Joi.string().valid('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_SLIP', 'BANK_TRANSFER', 'CHECK', 'FINANCED', 'INSTALLMENTS', 'CREDIT', 'EXCHANGE', 'LOYALTY_POINTS', 'DIGITAL_WALLET'),
    minTotalAmount: Joi.number().min(0),
    maxTotalAmount: Joi.number().min(0),
    minSaleDate: Joi.date().iso(),
    maxSaleDate: Joi.date().iso(),
    hasDeliveryAddress: Joi.boolean(),
    isOverdue: Joi.boolean(),
    isCreditSale: Joi.boolean(),
    hasTrackingCode: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    orderBy: Joi.string().valid('saleNumber', 'saleDate', 'totalAmount', 'status', 'createdAt').default('createdAt'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC'),
    search: Joi.string().max(255)
  })
})

// Validação para processamento de pagamento
export const processPaymentValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().uuid().required()
  }),
  [Segments.BODY]: Joi.object({
    paymentDate: Joi.date().iso().optional(),
    transactionId: Joi.string().max(100).optional(),
    paymentNotes: Joi.string().max(1000).optional()
  })
})

// Validação para cancelamento de venda
export const cancelSaleValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().uuid().required()
  }),
  [Segments.BODY]: Joi.object({
    cancellationReason: Joi.string().max(500).optional(),
    refundAmount: Joi.number().min(0).optional(),
    refundDate: Joi.date().iso().optional(),
    cancellationNotes: Joi.string().max(1000).optional()
  })
})

// Validação para obter detalhes da venda
export const getSaleDetailsValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().uuid().required()
  })
})

export default {
  createSaleValidation,
  updateSaleValidation,
  listSalesValidation,
  processPaymentValidation,
  cancelSaleValidation,
  getSaleDetailsValidation
}