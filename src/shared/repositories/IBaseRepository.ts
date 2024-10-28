import { IPaginationResult } from "@shared/viewModels/IPaginationResult";
import IPagination from "../viewModels/IPagination";
import IResult from "@shared/viewModels/IResult";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export interface IBaseRepository<T> {
  create(item: T): Promise<IResult<T>>;
  findById(id: string): Promise<IResult<T>>;
  findAll({ page, pageSize }: IPagination): Promise<IPaginationResult<T>>;
  update(id: string, item: QueryDeepPartialEntity<T>): Promise<IResult<T>>;
  delete(id: string): Promise<IResult<null>>;
}
