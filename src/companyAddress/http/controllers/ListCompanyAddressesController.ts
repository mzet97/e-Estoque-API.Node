import { Request, Response } from 'express'
import { container } from 'tsyringe'

import IController from '@shared/useCases/IController'
import ListCompanyAddressesUseCase from '../../useCases/listCompanyAddresses/ListCompanyAddressesUseCase'
import { CompanyAddressFilters } from '../../repositories/ICompanyAddressesRepository'
import CompanyAddressViewModel from '../../viewModels/CompanyAddressViewModel'

export default class ListCompanyAddressesController implements IController {
  async handle(request: Request, response: Response): Promise<void> {
    const listCompanyAddressesUseCase = container.resolve(ListCompanyAddressesUseCase)
    
    // Extrair filtros da query string
    const filters: CompanyAddressFilters = {
      companyId: request.query.companyId as string,
      type: request.query.type as any,
      city: request.query.city as string,
      state: request.query.state as string,
      isHeadquarters: request.query.isHeadquarters ? request.query.isHeadquarters === 'true' : undefined,
      isActive: request.query.isActive ? request.query.isActive === 'true' : undefined,
      department: request.query.department as string,
      contactPerson: request.query.contactPerson as string,
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 20,
      orderBy: request.query.orderBy as any || 'createdAt',
      orderDirection: request.query.orderDirection as any || 'DESC'
    }

    console.log('ListCompanyAddressesController.handle:', { filters })
    
    const result = await listCompanyAddressesUseCase.execute(filters)

    if (!result.success) {
      console.error('ListCompanyAddressesController.handle:', { message: result.message })
      response.status(400).json({
        success: false,
        data: null,
        message: result.message,
        errors: result.data ? [] : [{ code: 'LIST_COMPANY_ADDRESSES_ERROR', message: result.message }]
      })
      return
    }

    const viewModelResult = {
      ...result,
      data: CompanyAddressViewModel.fromCompanyAddressList(result.data)
    }

    console.log('ListCompanyAddressesController.handle:', { 
      totalItems: viewModelResult.pagination.totalItems,
      message: result.message 
    })
    
    response.status(200).json(viewModelResult)
  }
}