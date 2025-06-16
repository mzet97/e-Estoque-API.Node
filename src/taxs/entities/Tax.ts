import { BaseEntity } from '@shared/entities/BaseEntity'
import { Category } from 'src/categories/entities/Category'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'

@Entity('tax')
export class Tax extends BaseEntity {

  @Column()
  name: string

  @Column({
    length: 5000,
    })
  description: string

  @Column('decimal', { precision: 10, scale: 2 })
  percentage: number

  // Relacionamento com Category
  @Column('uuid')
  idCategory: string

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'idCategory' })
  category: Category
}
