import { BaseEntity } from '@shared/entities/BaseEntity'
import { Category } from 'src/categories/entities/Category'
import { Company } from 'src/companies/entities/Company'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity('product')
export class Product extends BaseEntity {

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

    @Column('decimal', { precision: 10, scale: 2 })
    price: number

    @Column('decimal', { precision: 10, scale: 3 })
    weight: number

    @Column('decimal', { precision: 10, scale: 2 })
    height: number

    @Column('decimal', { precision: 10, scale: 2 })
    length: number

    @Column({
        length: 500,
    })
    image: string

    // Relacionamento com Category
    @Column('uuid')
    idCategory: string

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'idCategory' })
    category: Category

    // Relacionamento com Company
    @Column('uuid')
    idCompany: string

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'idCompany' })
    company: Company
}