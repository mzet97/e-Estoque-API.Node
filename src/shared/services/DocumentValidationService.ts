/**
 * Serviço para validação de documentos brasileiros (CPF/CNPJ)
 */
export class DocumentValidationService {
  
  /**
   * Valida CPF usando algoritmo oficial
   */
  static validateCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false
    }

    // Verifica primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
      return false
    }

    // Verifica segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }
    return remainder === parseInt(cleanCPF.charAt(10))
  }

  /**
   * Valida CNPJ usando algoritmo oficial
   */
  static validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return false
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return false
    }

    // Verifica primeiro dígito verificador
    let sum = 0
    let weight = 5
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
      return false
    }

    // Verifica segundo dígito verificador
    sum = 0
    weight = 6
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder
    return digit2 === parseInt(cleanCNPJ.charAt(13))
  }

  /**
   * Determina o tipo de documento baseado no formato e validação
   */
  static getDocumentType(docId: string): 'CPF' | 'CNPJ' | 'INVALID' {
    const cleanDoc = docId.replace(/\D/g, '')
    
    if (cleanDoc.length === 11 && this.validateCPF(docId)) {
      return 'CPF'
    } else if (cleanDoc.length === 14 && this.validateCNPJ(docId)) {
      return 'CNPJ'
    }
    return 'INVALID'
  }

  /**
   * Formata CPF para exibição (000.000.000-00)
   */
  static formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '')
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Formata CNPJ para exibição (00.000.000/0000-00)
   */
  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  /**
   * Formata documento baseado no tipo para exibição
   */
  static formatDocument(docId: string): string {
    const docType = this.getDocumentType(docId)
    
    if (docType === 'CPF') {
      return this.formatCPF(docId)
    } else if (docType === 'CNPJ') {
      return this.formatCNPJ(docId)
    }
    
    return docId
  }

  /**
   * Valida documento independente do tipo (CPF/CNPJ)
   */
  static validateDocument(docId: string): boolean {
    const docType = this.getDocumentType(docId)
    return docType !== 'INVALID'
  }

  /**
   * Remove formatação de documento
   */
  static cleanDocument(docId: string): string {
    return docId.replace(/\D/g, '')
  }
}