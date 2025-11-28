import { inject, injectable } from 'tsyringe'
import BaseODataUseCase from '@shared/useCases/BaseODataUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import IUsersRepository, { UserFilters } from '../../repositories/IUsersRepository'
import { ODataQuery } from '@shared/services/ODataParser'
import { Request } from 'express'

export interface ListUsersODataFilters {
  oDataQuery?: ODataQuery
  userId?: string
  cacheEnabled?: boolean
  includeCount?: boolean
}

@injectable()
export default class ListUsersODataUseCase extends BaseODataUseCase<ListUsersODataFilters, IPaginationResult<any>> {
  constructor(
    @inject(ODataParserService.name)
    protected oDataParser: ODataParserService,

    @inject(ODataCacheService.name)
    protected oDataCache: ODataCacheService,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {
    super(oDataParser, oDataCache)
  }

  async execute(filters: ListUsersODataFilters): Promise<IResult<IPaginationResult<any>>> {
    try {
      console.log('ListUsersODataUseCase.execute:', filters)

      const { oDataQuery, userId, cacheEnabled = true, includeCount = false } = filters

      // If no OData query, use standard listing
      if (!oDataQuery) {
        const result = await this.usersRepository.findWithFilters({
          page: 1,
          pageSize: 15,
          orderBy: 'name',
          orderDirection: 'ASC'
        })

        return {
          success: true,
          data: result,
          message: 'Usuários listados com sucesso'
        }
      }

      // Handle OData query with caching
      const result = await this.handleWithCache(
        'users',
        oDataQuery,
        userId,
        async () => {
          // Define allowed fields for User entity
          const entityFields = [
            'id', 'name', 'email', 'isActive', 'isDeleted',
            'createdAt', 'updatedAt', 'lastLoginAt'
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

          const repositoryResult = await this.usersRepository.findWithFilters(repositoryFilters)

          // Handle $count
          let total = repositoryResult.total
          if (oDataQuery.count) {
            total = await this.usersRepository.count()
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
        message: 'Usuários listados com sucesso com OData',
        meta: {
          oDataQuery,
          cached: false // TODO: detect from cache
        }
      }

    } catch (error) {
      console.error('Error in ListUsersODataUseCase:', error)
      return {
        success: false,
        data: null,
        message: 'Erro interno ao listar usuários com OData'
      }
    }
  }
}
