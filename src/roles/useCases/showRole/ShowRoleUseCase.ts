import { Role } from '@roles/entities/Role'
import IRolesRepository from '@roles/repositories/IRolesRepository'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import { inject, injectable } from 'tsyringe'

type ShowRoleParams = {
  id: string
}

@injectable()
export default class ShowRoleUseCase implements IUseCase<ShowRoleParams, Role> {
  constructor(
    @inject('RolesRepository')
    private rolesRepository: IRolesRepository,
  ) {}

  async execute({ id }: ShowRoleParams): Promise<IResult<Role>> {
    return await this.rolesRepository.findById(id)
  }
}
