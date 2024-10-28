import { Role } from "@roles/entities/Role";
import { IBaseRepository } from "@shared/repositories/IBaseRepository";
import IResult from "@shared/viewModels/IResult";

export default interface IRolesRepository extends IBaseRepository<Role> {

  findByName(name: string): Promise<IResult<Role>>

}
