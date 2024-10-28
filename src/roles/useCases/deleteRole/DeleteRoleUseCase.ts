import IRolesRepository from '@roles/repositories/IRolesRepository'
import IUseCase from '@shared/useCases/IUseCase'
import IResult from '@shared/viewModels/IResult'
import { inject, injectable } from 'tsyringe'

type DeleteRoleParams = {
  id: string
}


@injectable()
export default class DeleteRoleUseCase implements IUseCase<DeleteRoleParams, null> {
  constructor(
    @inject('RolesRepository')
    private rolesRepository: IRolesRepository,
  ) {}

  async execute({ id }: DeleteRoleParams): Promise<IResult<null>> {
    const role = await this.rolesRepository.findById(id)
    if (!role.success) {
      return { data: null, success: false, message: 'Role not found' }
    }
    await this.rolesRepository.delete(id)

    return { data: null, success: true, message: 'Role deleted successfully' }
  }
}
