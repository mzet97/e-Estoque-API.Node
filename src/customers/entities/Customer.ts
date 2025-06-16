import { BaseEntity } from '@shared/entities/BaseEntity'
import { CustomerAddress } from 'src/customerAddress/entities/CustomerAddress'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity('customer')
export class Customer extends BaseEntity {

    @Column()
    name: string

    @Column({
        length: 18,
    })
    docId: string

    @Column({
        length: 250,
    })
    email: string
    @Column({
        length: 5000,
    })
    description: string

    @Column({
        length: 40,
    })
    phoneNumber: string

    @Column({
        length: 500,
    })
    shortDescription: string

    // Relacionamento com Category
    @Column('uuid')
    idCustomerAddress: string

    @ManyToOne(() => CustomerAddress)
    @JoinColumn({ name: 'idCustomerAddress' })
    customerAddress: CustomerAddress
}