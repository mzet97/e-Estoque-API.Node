import IPagination from "./IPagination";

export interface IPaginationResult<T> extends IPagination {
  data: T[];
  total: number;
}
