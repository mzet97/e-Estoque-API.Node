
import IResult from "@shared/viewModels/IResult";
import IPagination from "@shared/viewModels/IPagination";
import { IBaseRepository } from "./IBaseRepository";
import { Repository  } from "typeorm";
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { dataSource } from '@shared/typeorm'
import { IPaginationResult } from "@shared/viewModels/IPaginationResult";

export class BaseRepository<T> implements IBaseRepository<T> {
  protected repository: Repository<T>

  constructor(entity: new () => T) {
    this.repository = dataSource.getRepository(entity);
  }

  async create(item: T):  Promise<IResult<T>> {
    const result = await this.repository.save(item);
    return { data: result, success: true };
  }

  async findById(id: string): Promise<IResult<T | null>> {
    const result = await this.repository.findOne({ where: { id } as any });
    return { data: result, success: !!result };
  }

  async findAll({ page, pageSize }: IPagination): Promise<IPaginationResult<T>> {
    const [data, total] = await this.repository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async update(id: string, item: QueryDeepPartialEntity<T>): Promise<IResult<T>> {
    await this.repository.update(id, item);
    const updatedItem = await this.repository.findOne({ where: { id } as any });
    return {
      data: updatedItem,
      success: !!updatedItem,
      message: updatedItem ? 'Item updated successfully' : 'Item not found',
    };
  }

  async delete(id: string): Promise<IResult<null>> {
    await this.repository.delete(id);
    return { data: null, success: true };
  }

}
