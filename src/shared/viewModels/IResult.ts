export default interface IResult<T> {
  data: T;
  success: boolean;
  message?: string;
}
