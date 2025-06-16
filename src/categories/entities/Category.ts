import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

@Entity('category')
export class Category extends BaseEntity {

  @Column()
  name: string

  @Column({
    length: 5000,
    })
  description: string

  @Column({
    length: 500,
    })
  shortDescription: string
}
