import { injectable } from 'tsyringe'

export interface ODataFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'contains' | 'startswith' | 'endswith' | 'in' | 'nin'
  value: any
  logicalOperator?: 'and' | 'or'
}

export interface ODataOrderBy {
  field: string
  direction: 'ASC' | 'DESC'
}

export interface ODataQuery {
  filter?: ODataFilter[]
  select?: string[]
  orderby?: ODataOrderBy[]
  top?: number
  skip?: number
  count?: boolean
  expand?: string[]
}

@injectable()
export class ODataParserService {
  private operators: Record<string, string> = {
    eq: 'eq',
    ne: 'ne',
    gt: 'gt',
    ge: 'ge',
    lt: 'lt',
    le: 'le',
    contains: 'contains',
    startswith: 'startswith',
    endswith: 'endswith',
    in: 'in',
    nin: 'nin'
  }

  parse(queryString: string): ODataQuery | null {
    if (!queryString || queryString.trim() === '') {
      return null
    }

    const result: ODataQuery = {}
    const params = new URLSearchParams(queryString)

    // Parse $filter
    const filterParam = params.get('$filter')
    if (filterParam) {
      result.filter = this.parseFilter(filterParam)
    }

    // Parse $select
    const selectParam = params.get('$select')
    if (selectParam) {
      result.select = selectParam.split(',').map(s => s.trim())
    }

    // Parse $orderby
    const orderbyParam = params.get('$orderby')
    if (orderbyParam) {
      result.orderby = this.parseOrderBy(orderbyParam)
    }

    // Parse $top
    const topParam = params.get('$top')
    if (topParam) {
      result.top = parseInt(topParam, 10)
    }

    // Parse $skip
    const skipParam = params.get('$skip')
    if (skipParam) {
      result.skip = parseInt(skipParam, 10)
    }

    // Parse $count
    const countParam = params.get('$count')
    if (countParam) {
      result.count = countParam === 'true'
    }

    // Parse $expand
    const expandParam = params.get('$expand')
    if (expandParam) {
      result.expand = expandParam.split(',').map(s => s.trim())
    }

    return result
  }

  private parseFilter(filterStr: string): ODataFilter[] {
    const filters: ODataFilter[] = []
    const tokens = this.tokenize(filterStr)

    let i = 0
    while (i < tokens.length) {
      const filter = this.parseFilterExpression(tokens, i)
      if (filter) {
        filters.push(filter)
        // Skip 'and' or 'or'
        if (i < tokens.length && (tokens[i].toLowerCase() === 'and' || tokens[i].toLowerCase() === 'or')) {
          i++
        }
      } else {
        i++
      }
    }

    return filters
  }

  private parseFilterExpression(tokens: string[], startIndex: number): ODataFilter | null {
    let i = startIndex

    // Parse field
    if (i >= tokens.length) return null
    const field = tokens[i].replace(/['"]/g, '')
    i++

    // Skip dot notation (e.g., company.name)
    if (tokens[i] === '.' && i + 1 < tokens.length) {
      const subField = tokens[i + 1].replace(/['"]/g, '')
      i += 2
    }

    // Parse operator
    if (i >= tokens.length) return null
    const operatorToken = tokens[i].toLowerCase()
    const operator = this.mapOperator(operatorToken)
    if (!operator) return null
    i++

    // Parse value
    if (i >= tokens.length) return null
    let value = tokens[i].replace(/['"]/g, '')

    // Handle special value types
    if (value.toLowerCase() === 'true') {
      value = true
    } else if (value.toLowerCase() === 'false') {
      value = false
    } else if (!isNaN(Number(value))) {
      value = Number(value)
    }

    i++

    return {
      field,
      operator,
      value,
      logicalOperator: startIndex > 0 ? 'and' : undefined
    }
  }

  private parseOrderBy(orderbyStr: string): ODataOrderBy[] {
    const result: ODataOrderBy[] = []
    const parts = orderbyStr.split(',')

    for (const part of parts) {
      const trimmed = part.trim()
      const [field, direction] = trimmed.split(/\s+/)

      result.push({
        field: field.replace(/['"]/g, ''),
        direction: (direction?.toUpperCase() || 'ASC') as 'ASC' | 'DESC'
      })
    }

    return result
  }

  private mapOperator(token: string): ODataFilter['operator'] {
    const operatorMap: Record<string, ODataFilter['operator']> = {
      'eq': 'eq',
      'ne': 'ne',
      'gt': 'gt',
      'ge': 'ge',
      'lt': 'lt',
      'le': 'le',
      'contains': 'contains',
      'startswith': 'startswith',
      'endswith': 'endswith',
      'in': 'in',
      'nin': 'nin'
    }

    return operatorMap[token]
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < input.length; i++) {
      const char = input[i]

      if (char === "'") {
        inQuotes = !inQuotes
        current += char
      } else if (!inQuotes && (char === ' ' || char === '(' || char === ')')) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push(char)
      } else {
        current += char
      }
    }

    if (current) {
      tokens.push(current)
    }

    return tokens.filter(t => t.trim() !== '')
  }

  convertToTypeORMQuery(odataQuery: ODataQuery, entityFields: string[]): any {
    const where: any[] = []
    const orderBy: any = {}

    // Convert filters
    if (odataQuery.filter) {
      for (const filter of odataQuery.filter) {
        if (entityFields.includes(filter.field)) {
          where.push(this.convertFilterToTypeORM(filter))
        }
      }
    }

    // Convert orderby
    if (odataQuery.orderby) {
      for (const order of odataQuery.orderby) {
        if (entityFields.includes(order.field)) {
          orderBy[order.field] = order.direction
        }
      }
    }

    const query: any = {}

    if (where.length > 0) {
      query.where = where.length === 1 ? where[0] : where
    }

    if (Object.keys(orderBy).length > 0) {
      query.order = orderBy
    }

    // Add pagination
    if (odataQuery.top) {
      query.take = odataQuery.top
    }

    if (odataQuery.skip) {
      query.skip = odataQuery.skip
    }

    // Add relations for expand
    if (odataQuery.expand && odataQuery.expand.length > 0) {
      query.relations = odataQuery.expand
    }

    return query
  }

  private convertFilterToTypeORM(filter: ODataFilter): any {
    const { field, operator, value } = filter

    switch (operator) {
      case 'eq':
        return { [field]: value }
      case 'ne':
        return { [field]: Not(value) }
      case 'gt':
        return { [field]: MoreThan(value) }
      case 'ge':
        return { [field]: MoreThanOrEqual(value) }
      case 'lt':
        return { [field]: LessThan(value) }
      case 'le':
        return { [field]: LessThanOrEqual(value) }
      case 'contains':
        return { [field]: Like(`%${value}%`) }
      case 'startswith':
        return { [field]: Like(`${value}%`) }
      case 'endswith':
        return { [field]: Like(`%${value}`) }
      case 'in':
        return { [field]: In(Array.isArray(value) ? value : [value]) }
      case 'nin':
        return { [field]: Not(In(Array.isArray(value) ? value : [value])) }
      default:
        return { [field]: value }
    }
  }
}

// Import TypeORM operators
import { Not, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Like, In } from 'typeorm'

export default ODataParserService
