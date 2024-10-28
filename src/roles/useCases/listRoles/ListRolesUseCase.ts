import { Role } from '@roles/entities/Role'
import IRolesRepository from '@roles/repositories/IRolesRepository'
import IUseCase from '@shared/useCases/IUseCase'
import IPagination from '@shared/viewModels/IPagination'
import { IPaginationResult } from '@shared/viewModels/IPaginationResult'
import { inject, injectable } from 'tsyringe'

@injectable()
export default class ListRolesUseCase implements IUseCase<IPagination, Role> {
  constructor(
    @inject('RolesRepository')
    private rolesRepository: IRolesRepository,
  ) {}

  async execute(viewModel: IPagination): Promise<IPaginationResult<Role>> {
    const roles = await this.rolesRepository.findAll(viewModel)
    return {
      data: roles.data,
      total: roles.total,
      page: viewModel.page,
      pageSize: viewModel.pageSize,
    };
  }
}
