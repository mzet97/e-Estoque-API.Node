import { IPaginationResult } from "@shared/viewModels/IPaginationResult";
import IResult from "@shared/viewModels/IResult";

export default interface IUseCase<T, R> {
  execute(viewModel: T): Promise<IResult<R> | IPaginationResult<R>>
}
