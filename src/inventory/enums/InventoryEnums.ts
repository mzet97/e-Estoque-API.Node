/**
 * Tipo de movimento de estoque
 */
export enum MovementType {
  IN = 'IN',      // Entrada (compra, produção, devolução, ajuste positivo)
  OUT = 'OUT'     // Saída (venda, perda, roubo, ajuste negativo, transferência)
}

/**
 * Reason de movimento de estoque
 */
export enum MovementReason {
  // Entradas (IN)
  PURCHASE = 'PURCHASE',           // Compra
  PRODUCTION = 'PRODUCTION',       // Produção
  RETURN_FROM_CUSTOMER = 'RETURN_FROM_CUSTOMER', // Devolução de cliente
  TRANSFER_IN = 'TRANSFER_IN',     // Transferência de entrada
  ADJUSTMENT_POSITIVE = 'ADJUSTMENT_POSITIVE', // Ajuste positivo
  CORRECTION = 'CORRECTION',       // Correção de erro
  DONATION_RECEIVED = 'DONATION_RECEIVED', // Doação recebida
  SAMPLE_USED = 'SAMPLE_USED',     // Amostra usada (entrada para contrapartida)
  MANUFACTURING = 'MANUFACTURING', // Fabricação
  ASSEMBLY = 'ASSEMBLY',           // Montagem

  // Saídas (OUT)
  SALE = 'SALE',                   // Venda
  DAMAGE = 'DAMAGE',               // Danificado
  THEFT = 'THEFT',                 // Roubo
  LOSS = 'LOSS',                   // Perda
  EXPIRED = 'EXPIRED',             // Vencido
  TRANSFER_OUT = 'TRANSFER_OUT',   // Transferência de saída
  ADJUSTMENT_NEGATIVE = 'ADJUSTMENT_NEGATIVE', // Ajuste negativo
  DONATION_MADE = 'DONATION_MADE', // Doação feita
  SAMPLE_DISTRIBUTED = 'SAMPLE_DISTRIBUTED', // Amostra distribuída
  SCRAP = 'SCRAP',                 // Sucata
  REPAIR = 'REPAIR',               // Reparo (peças utilizadas)
  MAINTENANCE = 'MAINTENANCE',     // Manutenção
  RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER', // Devolução ao fornecedor
  RECALL = 'RECALL',               // Recall
  WEATHER_DAMAGE = 'WEATHER_DAMAGE', // Dano climático
  FIRE_DAMAGE = 'FIRE_DAMAGE',     // Dano de fogo
  FLOOD_DAMAGE = 'FLOOD_DAMAGE'    // Dano de enchente
}