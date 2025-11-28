import { inject, injectable } from 'tsyringe'
import BaseODataUseCase from '@shared/useCases/BaseODataUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IInventoryRepository, { InventoryFilters } from '../../repositories/IInventoryRepository'
import { ODataQuery } from '@shared/services/ODataParser'
import { Request } from 'express'

export interface ListInventoryODataFilters {
  oDataQuery?: ODataQuery
  userId?: string
  cacheEnabled?: boolean
  includeCount?: boolean
}

@injectable()
export default class ListInventoryODataUseCase extends BaseODataUseCase<ListInventoryODataFilters, IPaginationResult<any>> {
  constructor(
    @inject(ODataParserService.name)
    protected oDataParser: ODataParserService,

    @inject(ODataCacheService.name)
    protected oDataCache: ODataCacheService,

    @inject('InventoryRepository')
    private inventoryRepository: IInventoryRepository,
  ) {
    super(oDataParser, oDataCache)
  }

  async execute(filters: ListInventoryODataFilters): Promise<IResult<IPaginationResult<any>>> {
    try {
      console.log('ListInventoryODataUseCase.execute:', filters)

      const { oDataQuery, userId, cacheEnabled = true, includeCount = false } = filters

      // If no OData query, use standard listing
      if (!oDataQuery) {
        const result = await this.inventoryRepository.findWithFilters({
          page: 1,
          pageSize: 15,
          orderBy: 'createdAt',
          orderDirection: 'DESC'
        })

        return {
          success: true,
          data: result,
          message: 'Movimentações de estoque listadas com sucesso'
        }
      }

      // Handle OData query with caching
      const result = await this.handleWithCache(
        'inventory',
        oDataQuery,
        userId,
        async () => {
          // Define allowed fields for Inventory entity
          const entityFields = [
            'id', 'productId', 'companyId', 'userId', 'movementType',
            'movementReason', 'quantity', 'unitCost', 'totalCost',
            'notes', 'reference', 'createdAt', 'updatedAt'
          ]

          // Convert OData query to TypeORM query
          const typeOrmQuery = this.convertODataToTypeORM(oDataQuery, entityFields)

          // Build filters for repository
          const repositoryFilters: any = {
            page: oDataQuery.top ? 1 : undefined,
            pageSize: oDataQuery.top || 15,
            orderBy: 'createdAt',
            orderDirection: 'DESC'
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

          const repositoryResult = await this.inventoryRepository.findWithFilters(repositoryFilters)

          // Handle $count
          let total = repositoryResult.total
          if (oDataQuery.count) {
            total = await this.inventoryRepository.count()
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
        message: 'Movimentações de estoque listadas com sucesso com OData',
        meta: {
          oDataQuery,
          cached: false // TODO: detect from cache
        }
      }

    } catch (error) {
      console.error('Error in ListInventoryODataUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar movimentações de estoque com OData'
      }
    }
  }
}
