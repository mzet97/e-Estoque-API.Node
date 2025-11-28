import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import Customer from '../../../customers/entities/Customer'

@Entity('customer_addresses')
export class CustomerAddress extends BaseEntity {
    @Column({ name: 'type', length: 50 })
    type: 'shipping' | 'billing' | 'residential'

    @Column({ name: 'street', length: 255 })
    street: string

    @Column({ name: 'number', length: 20 })
    number: string

    @Column({ name: 'complement', length: 255, nullable: true })
    complement?: string

    @Column({ name: 'neighborhood', length: 255 })
    neighborhood: string

    @Column({ name: 'district', length: 255 })
    district: string

    @Column({ name: 'city', length: 255 })
    city: string

    @Column({ name: 'state', length: 2 })
    state: string

    @Column({ name: 'country', length: 100, default: 'Brasil' })
    country: string

    @Column({ name: 'zip_code', length: 10 })
    zipCode: string

    @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude?: number

    @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude?: number

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault: boolean

    @Column({ name: 'customer_id' })
    customerId: string

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer

    constructor() {
        super()
    }

    isValid(): boolean {
        return !!(
            this.street &&
            this.number &&
            this.neighborhood &&
            this.city &&
            this.state &&
            this.zipCode &&
            this.customerId
        )
    }
}

export default CustomerAddress