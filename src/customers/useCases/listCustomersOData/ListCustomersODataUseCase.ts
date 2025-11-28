import { inject, injectable } from 'tsyringe'
import BaseODataUseCase from '@shared/useCases/BaseODataUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ICustomersRepository, { CustomerFilters } from '../../repositories/ICustomersRepository'
import { ODataQuery } from '@shared/services/ODataParser'
import { Request } from 'express'

export interface ListCustomersODataFilters {
  oDataQuery?: ODataQuery
  userId?: string
  cacheEnabled?: boolean
  includeCount?: boolean
}

@injectable()
export default class ListCustomersODataUseCase extends BaseODataUseCase<ListCustomersODataFilters, IPaginationResult<any>> {
  constructor(
    @inject(ODataParserService.name)
    protected oDataParser: ODataParserService,

    @inject(ODataCacheService.name)
    protected oDataCache: ODataCacheService,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {
    super(oDataParser, oDataCache)
  }

  async execute(filters: ListCustomersODataFilters): Promise<IResult<IPaginationResult<any>>> {
    try {
      console.log('ListCustomersODataUseCase.execute:', filters)

      const { oDataQuery, userId, cacheEnabled = true, includeCount = false } = filters

      // If no OData query, use standard listing
      if (!oDataQuery) {
        const result = await this.customersRepository.findWithFilters({
          page: 1,
          pageSize: 15,
          orderBy: 'name',
          orderDirection: 'ASC'
        })

        return {
          success: true,
          data: result,
          message: 'Clientes listados com sucesso'
        }
      }

      // Handle OData query with caching
      const result = await this.handleWithCache(
        'customers',
        oDataQuery,
        userId,
        async () => {
          // Define allowed fields for Customer entity
          const entityFields = [
            'id', 'name', 'docId', 'email', 'description', 'phoneNumber',
            'customerAddress', 'createdAt', 'updatedAt'
          ]

          // Convert OData query to TypeORM query
          const typeOrmQuery = this.convertODataToTypeORM(oDataQuery, entityFields)

          // Build filters for repository
          const repositoryFilters: any = {
            page: oDataQuery.top ? 1 : undefined,
            pageSize: oDataQuery.top || 15,
            orderBy: 'name',
            orderDirection: 'ASC'
          }

          // Add converted filters
          if (typeOrmQuery.where) {
            repositoryFilters.where = typeOrmQuery.where
          }

          if (typeOrmQuery.order) {
            repositoryFilters.orderBy = Object.keys(typeOrmQuery.order)[0]
            repositoryFilters.orderDirection = typeOrmQuery.order[repositoryFilters.orderBy]
          }

          if (typeOrmQuery.take) {
            repositoryFilters.pageSize = typeOrmQuery.take
          }

          if (typeOrmQuery.skip) {
            const page = Math.floor(typeOrmQuery.skip / (repositoryFilters.pageSize || 15)) + 1
            repositoryFilters.page = page
          }

          // Add relations for $expand
          if (typeOrmQuery.relations && typeOrmQuery.relations.length > 0) {
            repositoryFilters.relations = typeOrmQuery.relations
          }

          console.log('Repository filters:', repositoryFilters)

          const repositoryResult = await this.customersRepository.findWithFilters(repositoryFilters)

          // Handle $count
          let total = repositoryResult.total
          if (oDataQuery.count) {
            total = await this.customersRepository.count()
          }

          return {
            ...repositoryResult,
            total
          }
        },
        cacheEnabled
      )

      return {
        success: true,
        data: result,
        message: 'Clientes listados com sucesso com OData',
        meta: {
          oDataQuery,
          cached: false // TODO: detect from cache
        }
      }

    } catch (error) {
      console.error('Error in ListCustomersODataUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar clientes com OData'
      }
    }
  }
}
