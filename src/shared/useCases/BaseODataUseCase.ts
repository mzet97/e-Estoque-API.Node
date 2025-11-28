import { inject, injectable } from 'tsyringe'
import IUseCase from './IUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { ODataQuery, ODataParserService } from '@shared/services/ODataParser'
import { ODataCacheService } from '@shared/services/ODataCacheService'
import { Request } from 'express'

export interface BaseODataFilters {
  oDataQuery?: ODataQuery
  userId?: string
  cacheEnabled?: boolean
}

@injectable()
export default abstract class BaseODataUseCase<T, R> implements IUseCase<BaseODataFilters, IResult<R>> {
  constructor(
    @inject(ODataParserService.name)
    protected oDataParser: ODataParserService,

    @inject(ODataCacheService.name)
    protected oDataCache: ODataCacheService,
  ) {}

  abstract execute(filters: BaseODataFilters): Promise<IResult<R>>

  protected async handleWithCache(
    entityName: string,
    query: ODataQuery,
    userId: string | undefined,
    fetchFunction: () => Promise<any>,
    cacheEnabled: boolean = true
  ): Promise<any> {
    // Try to get from cache first (if enabled)
    if (cacheEnabled) {
      const cachedData = await this.oDataCache.get(entityName, query, userId)
      if (cachedData) {
        return cachedData
      }
    }

    // Fetch fresh data
    const data = await fetchFunction()

    // Cache the result (if enabled and not a count query)
    if (cacheEnabled && !query.count) {
      const ttl = this.oDataCache.getOptimalTTL(query)
      await this.oDataCache.set(entityName, query, data, userId, ttl)
    }

    return data
  }

  protected extractODataFromRequest(req: Request): ODataQuery | undefined {
    return req.oDataQuery
  }

  protected getEntityFields(entity: any): string[] {
    if (!entity || !entity.columns) {
      return []
    }

    return Object.keys(entity.columns)
  }

  protected convertODataToTypeORM(
    oDataQuery: ODataQuery,
    allowedFields: string[]
  ): any {
    return this.oDataParser.convertToTypeORMQuery(oDataQuery, allowedFields)
  }

  protected isComplexQuery(query: ODataQuery): boolean {
    return this.oDataCache.isComplexQuery(query)
  }

  protected async invalidateCache(entityName: string): Promise<void> {
    await this.oDataCache.invalidate(entityName)
  }

  protected async getCacheStats(): Promise<any> {
    return await this.oDataCache.getStats()
  }
}
