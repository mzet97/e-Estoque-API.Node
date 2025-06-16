import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity } from 'typeorm'

@Entity('address')
export class Address extends BaseEntity {

    @Column()
    street: string

    @Column()
    number: string

    @Column({
        length: 250,
    })
    complement: string

    @Column({
        length: 250,
    })
    neighborhood: string

    @Column({
        length: 250,
    })
    district: string

    @Column({
        length: 250,
    })
    city: string

    @Column({
        length: 250,
    })
    county: string

    @Column({
        length: 250,
    })
    zipCode: string

    @Column({
        length: 250,
    })
    latitude: string
    
    @Column({
        length: 250,
    })
    longitude: string
}
