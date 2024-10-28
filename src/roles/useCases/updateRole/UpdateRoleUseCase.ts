import { Role } from '@roles/entities/Role'
import IRolesRepository from '@roles/repositories/IRolesRepository'
import UpdateRoleViewModel from '@roles/viewModels/UpdateRoleViewModel'

import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import { inject, injectable } from 'tsyringe'

@injectable()
export default class UpdateRoleUseCase implements IUseCase<UpdateRoleViewModel, Role> {
  constructor(
    @inject('RolesRepository')
    private rolesRepository: IRolesRepository,
  ) {}

  async execute(viewModel: UpdateRoleViewModel): Promise<IResult<Role>> {
    const roleAlreadyExists = await this.rolesRepository.findByName(viewModel.name)

    if (!roleAlreadyExists.success) {
      return { data: null, success: false, message: 'Role not exists' }
    }

    const role = roleAlreadyExists.data as Role
    role.name = viewModel.name;
    role.isDeleted = false;

    return this.rolesRepository.update(viewModel.id, viewModel)
  }
}
