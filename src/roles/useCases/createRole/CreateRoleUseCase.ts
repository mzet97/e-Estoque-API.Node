import { Role } from '@roles/entities/Role'
import IRolesRepository from '@roles/repositories/IRolesRepository'
import CreateRoleViewModel from '@roles/viewModels/CreateRoleViewModel'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import { inject, injectable } from 'tsyringe'

@injectable()
export default class CreateRoleUseCase implements IUseCase<CreateRoleViewModel, Role> {
  constructor(
    @inject('RolesRepository')
    private rolesRepository: IRolesRepository,
  ) {}

  async execute({ name }: CreateRoleViewModel): Promise<IResult<Role>> {
    const roleAlreadyExists = await this.rolesRepository.findByName(name);

    if (roleAlreadyExists.success) {
      return { data: null, success: false, message: 'Role already exists' };
    }

    const role = new Role();
    role.name = name;
    role.isDeleted = false;
    role.createdAt = new Date();

    return this.rolesRepository.create(role);
  }
}

