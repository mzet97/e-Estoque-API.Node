export enum SaleType {
    RETAIL = 'RETAIL',           // Varejo (PDV/Loja)
    WHOLESALE = 'WHOLESALE',     // Atacado (Grandes volumes)
    CONSIGNMENT = 'CONSIGNMENT', // Consignação (Venda com devolução)
    SERVICE = 'SERVICE',         // Prestação de Serviços
    B2B = 'B2B',                 // Business to Business
    B2C = 'B2C',                 // Business to Consumer
    MARKETPLACE = 'MARKETPLACE', // Marketplace/Vendas online
    DIRECT_SALE = 'DIRECT_SALE', // Venda Direta
    FRANCHISE = 'FRANCHISE',     // Franquia
    PARTNERSHIP = 'PARTNERSHIP'  // Parceria/Revenda
}

// Classe utilitária para SaleType
export class SaleTypeHelper {
    // Verificar se é venda presencial
    static isInPersonSale(saleType: SaleType): boolean {
        return [
            SaleType.RETAIL,
            SaleType.DIRECT_SALE
        ].includes(saleType)
    }

    // Verificar se é venda online
    static isOnlineSale(saleType: SaleType): boolean {
        return [
            SaleType.MARKETPLACE,
            SaleType.B2C
        ].includes(saleType)
    }

    // Verificar se é venda corporativa
    static isBusinessSale(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.PARTNERSHIP,
            SaleType.FRANCHISE
        ].includes(saleType)
    }

    // Verificar se é venda de serviços
    static isServiceSale(saleType: SaleType): boolean {
        return saleType === SaleType.SERVICE
    }

    // Verificar se requer entrega
    static requiresDelivery(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.MARKETPLACE,
            SaleType.B2C,
            SaleType.PARTNERSHIP
        ].includes(saleType)
    }

    // Verificar se permite consignação
    static allowsConsignment(saleType: SaleType): boolean {
        return saleType === SaleType.CONSIGNMENT
    }

    // Verificar se é venda com margem diferenciada
    static hasDifferentialMargin(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.PARTNERSHIP
        ].includes(saleType)
    }

    // Obter descrição do tipo de venda
    static getDescription(saleType: SaleType): string {
        const descriptions = {
            [SaleType.RETAIL]: 'Varejo (PDV/Loja)',
            [SaleType.WHOLESALE]: 'Atacado (Grandes Volumes)',
            [SaleType.CONSIGNMENT]: 'Consignação',
            [SaleType.SERVICE]: 'Prestação de Serviços',
            [SaleType.B2B]: 'Business to Business',
            [SaleType.B2C]: 'Business to Consumer',
            [SaleType.MARKETPLACE]: 'Marketplace/Vendas Online',
            [SaleType.DIRECT_SALE]: 'Venda Direta',
            [SaleType.FRANCHISE]: 'Franquia',
            [SaleType.PARTNERSHIP]: 'Parceria/Revenda'
        }
        return descriptions[saleType] || saleType
    }

    // Verificar se requer aprovação especial
    static requiresSpecialApproval(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.PARTNERSHIP,
            SaleType.CONSIGNMENT
        ].includes(saleType)
    }

    // Verificar se permite desconto especial
    static allowsSpecialDiscount(saleType: SaleType): boolean {
        return SaleTypeHelper.hasDifferentialMargin(saleType)
    }

    // Verificar se é venda com prazo diferenciado
    static hasDifferentialTerms(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.CONSIGNMENT,
            SaleType.SERVICE
        ].includes(saleType)
    }

    // Obter margem típica esperada (%)
    static getTypicalMargin(saleType: SaleType): number {
        const margins = {
            [SaleType.RETAIL]: 30.0,      // 30% margem varejo
            [SaleType.WHOLESALE]: 15.0,   // 15% margem atacado
            [SaleType.CONSIGNMENT]: 25.0, // 25% margem consignação
            [SaleType.SERVICE]: 50.0,     // 50% margem serviços
            [SaleType.B2B]: 20.0,         // 20% margem B2B
            [SaleType.B2C]: 25.0,         // 25% margem B2C
            [SaleType.MARKETPLACE]: 20.0, // 20% margem marketplace
            [SaleType.DIRECT_SALE]: 35.0, // 35% margem venda direta
            [SaleType.FRANCHISE]: 22.0,   // 22% margem franquia
            [SaleType.PARTNERSHIP]: 18.0  // 18% margem parceria
        }
        return margins[saleType] || 25.0
    }

    // Verificar se é venda com volume mínimo
    static hasMinimumQuantity(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.PARTNERSHIP
        ].includes(saleType)
    }

    // Obter quantidade mínima típica
    static getMinimumQuantity(saleType: SaleType): number {
        const minimums = {
            [SaleType.WHOLESALE]: 50,     // 50 unidades
            [SaleType.B2B]: 25,           // 25 unidades
            [SaleType.PARTNERSHIP]: 10    // 10 unidades
        }
        return minimums[saleType] || 1
    }

    // Verificar se é venda com prazo de pagamento diferenciado
    static hasDifferentialPaymentTerms(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.CONSIGNMENT,
            SaleType.SERVICE
        ].includes(saleType)
    }

    // Obter prazo de pagamento típico (dias)
    static getTypicalPaymentDays(saleType: SaleType): number {
        const terms = {
            [SaleType.RETAIL]: 0,         // À vista
            [SaleType.WHOLESALE]: 30,     // 30 dias
            [SaleType.CONSIGNMENT]: 60,   // 60 dias
            [SaleType.SERVICE]: 15,       // 15 dias
            [SaleType.B2B]: 30,           // 30 dias
            [SaleType.B2C]: 0,            // À vista
            [SaleType.MARKETPLACE]: 7,    // 7 dias
            [SaleType.DIRECT_SALE]: 0,    // À vista
            [SaleType.FRANCHISE]: 30,     // 30 dias
            [SaleType.PARTNERSHIP]: 15    // 15 dias
        }
        return terms[saleType] || 0
    }

    // Verificar se requer contrato
    static requiresContract(saleType: SaleType): boolean {
        return [
            SaleType.CONSIGNMENT,
            SaleType.B2B,
            SaleType.PARTNERSHIP,
            SaleType.FRANCHISE,
            SaleType.SERVICE
        ].includes(saleType)
    }

    // Verificar se é venda com garantia especial
    static hasSpecialWarranty(saleType: SaleType): boolean {
        return [
            SaleType.B2B,
            SaleType.SERVICE,
            SaleType.FRANCHISE
        ].includes(saleType)
    }

    // Obter código interno para relatórios
    static getInternalCode(saleType: SaleType): string {
        const codes = {
            [SaleType.RETAIL]: 'VDR',
            [SaleType.WHOLESALE]: 'ATC',
            [SaleType.CONSIGNMENT]: 'CON',
            [SaleType.SERVICE]: 'SRV',
            [SaleType.B2B]: 'B2B',
            [SaleType.B2C]: 'B2C',
            [SaleType.MARKETPLACE]: 'MKT',
            [SaleType.DIRECT_SALE]: 'DIR',
            [SaleType.FRANCHISE]: 'FRN',
            [SaleType.PARTNERSHIP]: 'PRT'
        }
        return codes[saleType] || saleType
    }

    // Verificar se é venda recorrente
    static isRecurringSale(saleType: SaleType): boolean {
        return [
            SaleType.SERVICE,
            SaleType.CONSIGNMENT,
            SaleType.PARTNERSHIP
        ].includes(saleType)
    }

    // Verificar se requer relatórios especiais
    static requiresSpecialReports(saleType: SaleType): boolean {
        return [
            SaleType.WHOLESALE,
            SaleType.B2B,
            SaleType.CONSIGNMENT,
            SaleType.FRANCHISE
        ].includes(saleType)
    }
}