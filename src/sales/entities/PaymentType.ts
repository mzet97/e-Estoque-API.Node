export enum PaymentType {
    // Pagamento à vista
    CASH = 'CASH',                   // Dinheiro
    CREDIT_CARD = 'CREDIT_CARD',     // Cartão de Crédito
    DEBIT_CARD = 'DEBIT_CARD',       // Cartão de Débito
    PIX = 'PIX',                     // PIX
    
    // Pagamentos bancários
    BANK_SLIP = 'BANK_SLIP',         // Boleto Bancário
    BANK_TRANSFER = 'BANK_TRANSFER', // Transferência Bancária
    CHECK = 'CHECK',                 // Cheque
    
    // Pagamentos parcelados/financiados
    FINANCED = 'FINANCED',           // Financiado
    INSTALLMENTS = 'INSTALLMENTS',   // Parcelado
    CREDIT = 'CREDIT',               // Crédito/Prazo
    
    // Outros
    EXCHANGE = 'EXCHANGE',           // Troca
    LOYALTY_POINTS = 'LOYALTY_POINTS', // Pontos de Fidelidade
    DIGITAL_WALLET = 'DIGITAL_WALLET'  // Carteira Digital
}

// Classe utilitária para PaymentType
export class PaymentTypeHelper {
    // Verificar se é pagamento à vista
    static isImmediatePayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.CASH,
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD,
            PaymentType.PIX,
            PaymentType.BANK_TRANSFER,
            PaymentType.CHECK
        ].includes(paymentType)
    }

    // Verificar se é pagamento parcelado
    static isInstallmentPayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.FINANCED,
            PaymentType.INSTALLMENTS,
            PaymentType.CREDIT
        ].includes(paymentType)
    }

    // Verificar se é pagamento digital
    static isDigitalPayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.PIX,
            PaymentType.DIGITAL_WALLET,
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD
        ].includes(paymentType)
    }

    // Verificar se requer validação adicional
    static requiresAdditionalValidation(paymentType: PaymentType): boolean {
        return [
            PaymentType.BANK_SLIP,
            PaymentType.BANK_TRANSFER,
            PaymentType.CHECK,
            PaymentType.FINANCED,
            PaymentType.CREDIT
        ].includes(paymentType)
    }

    // Verificar se permite desconto
    static allowsDiscount(paymentType: PaymentType): boolean {
        return PaymentTypeHelper.isImmediatePayment(paymentType)
    }

    // Verificar se permite parcelamento
    static allowsInstallments(paymentType: PaymentType): boolean {
        return PaymentTypeHelper.isInstallmentPayment(paymentType)
    }

    // Verificar se é pagamento presencial
    static isInPersonPayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.CASH,
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD
        ].includes(paymentType)
    }

    // Verificar se é pagamento online
    static isOnlinePayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.PIX,
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD,
            PaymentType.DIGITAL_WALLET
        ].includes(paymentType)
    }

    // Obter descrição do tipo de pagamento
    static getDescription(paymentType: PaymentType): string {
        const descriptions = {
            [PaymentType.CASH]: 'Dinheiro',
            [PaymentType.CREDIT_CARD]: 'Cartão de Crédito',
            [PaymentType.DEBIT_CARD]: 'Cartão de Débito',
            [PaymentType.PIX]: 'PIX',
            [PaymentType.BANK_SLIP]: 'Boleto Bancário',
            [PaymentType.BANK_TRANSFER]: 'Transferência Bancária',
            [PaymentType.CHECK]: 'Cheque',
            [PaymentType.FINANCED]: 'Financiado',
            [PaymentType.INSTALLMENTS]: 'Parcelado',
            [PaymentType.CREDIT]: 'Crédito/Prazo',
            [PaymentType.EXCHANGE]: 'Troca',
            [PaymentType.LOYALTY_POINTS]: 'Pontos de Fidelidade',
            [PaymentType.DIGITAL_WALLET]: 'Carteira Digital'
        }
        return descriptions[paymentType] || paymentType
    }

    // Verificar se é pagamento seguro
    static isSecurePayment(paymentType: PaymentType): boolean {
        return [
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD,
            PaymentType.PIX,
            PaymentType.DIGITAL_WALLET
        ].includes(paymentType)
    }

    // Verificar se permite estorno
    static allowsRefund(paymentType: PaymentType): boolean {
        return [
            PaymentType.CASH,
            PaymentType.CREDIT_CARD,
            PaymentType.DEBIT_CARD,
            PaymentType.BANK_TRANSFER
        ].includes(paymentType)
    }

    // Obter código interno para relatórios
    static getInternalCode(paymentType: PaymentType): string {
        const codes = {
            [PaymentType.CASH]: 'DIN',
            [PaymentType.CREDIT_CARD]: 'CRE',
            [PaymentType.DEBIT_CARD]: 'DEB',
            [PaymentType.PIX]: 'PIX',
            [PaymentType.BANK_SLIP]: 'BOL',
            [PaymentType.BANK_TRANSFER]: 'TRA',
            [PaymentType.CHECK]: 'CHQ',
            [PaymentType.FINANCED]: 'FIN',
            [PaymentType.INSTALLMENTS]: 'PAR',
            [PaymentType.CREDIT]: 'CRD',
            [PaymentType.EXCHANGE]: 'TRO',
            [PaymentType.LOYALTY_POINTS]: 'PTS',
            [PaymentType.DIGITAL_WALLET]: 'WAL'
        }
        return codes[paymentType] || paymentType
    }

    // Verificar se é pagamento reversível
    static isReversible(paymentType: PaymentType): boolean {
        return PaymentTypeHelper.allowsRefund(paymentType)
    }

    // Obter percentual típico de desconto para o tipo de pagamento
    static getTypicalDiscountRate(paymentType: PaymentType): number {
        if (PaymentTypeHelper.isImmediatePayment(paymentType)) {
            switch (paymentType) {
                case PaymentType.CASH:
                    return 5.0  // 5% desconto para dinheiro
                case PaymentType.PIX:
                    return 3.0  // 3% desconto para PIX
                case PaymentType.DEBIT_CARD:
                    return 2.0  // 2% desconto para débito
                default:
                    return 0.0
            }
        }
        return 0.0
    }
}
  