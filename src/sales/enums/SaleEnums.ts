/**
 * Status da venda
 */
export enum SaleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

/**
 * Método de pagamento
 */
export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_SLIP = 'bank_slip',
  CASH = 'cash'
}