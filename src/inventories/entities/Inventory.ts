import { BaseEntity } from '@shared/entities/BaseEntity'
import { Product } from 'src/products/entities/Product'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity('inventory')
export class Inventory extends BaseEntity {

    @Column('int')
    quantity: number

    @Column('datetime')
    dateOrder: Date

    // Relacionamento com Product
    @Column('uuid')
    idProduct: string

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'idProduct' })
    product: Product
}