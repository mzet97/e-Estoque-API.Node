import IPaginationResult from '@shared/viewModels/IPaginationResult'
import ShowCompanyViewModel from './ShowCompanyViewModel'

export default class ListCompaniesViewModel {
  items: ShowCompanyViewModel[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }

  constructor(paginationResult: IPaginationResult<any>) {
    this.items = ShowCompanyViewModel.fromCompanyList(paginationResult.data.items)
    this.pagination = paginationResult.data.pagination
  }

  static fromPaginationResult(paginationResult: IPaginationResult<any>): ListCompaniesViewModel {
    return new ListCompaniesViewModel(paginationResult)
  }
}
