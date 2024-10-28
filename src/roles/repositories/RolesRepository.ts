import { Role } from "@roles/entities/Role";
import { BaseRepository } from "@shared/repositories/BaseRepository";
import IRolesRepository from "./IRolesRepository";
import IResult from "@shared/viewModels/IResult";

export default class RolesRepository extends BaseRepository<Role> implements IRolesRepository {

  constructor() {
    super(Role);
  }

  async findByName(name: string): Promise<IResult<Role>> {
    const result = await this.repository.findOne({ where: { name } as any });
    return { data: result, success: !!result };
  }

}
