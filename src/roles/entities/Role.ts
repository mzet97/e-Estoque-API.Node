import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

@Entity('roles')
export class Role extends BaseEntity {

  @Column()
  name: string

}
