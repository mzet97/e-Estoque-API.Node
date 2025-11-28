import { BaseEntity } from '@shared/entities/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import Company from '../../../companies/entities/Company'

@Entity('company_addresses')
export class CompanyAddress extends BaseEntity {
    @Column({ name: 'type', length: 50 })
    type: 'headquarters' | 'branch' | 'warehouse' | 'billing' | 'shipping'

    @Column({ name: 'department', length: 100, nullable: true })
    department?: string

    @Column({ name: 'contact_person', length: 255, nullable: true })
    contactPerson?: string

    @Column({ name: 'phone', length: 20, nullable: true })
    phone?: string

    @Column({ name: 'email', length: 255, nullable: true })
    email?: string

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

    @Column({ name: 'is_headquarters', type: 'boolean', default: false })
    isHeadquarters: boolean

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean

    @Column({ name: 'company_id' })
    companyId: string

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company

    constructor() {
        super()
    }

    isValid(): boolean {
        return !!(
            this.type &&
            this.street &&
            this.number &&
            this.neighborhood &&
            this.city &&
            this.state &&
            this.zipCode &&
            this.companyId
        )
    }

    isHeadquartersAddress(): boolean {
        return this.isHeadquarters
    }

    isActiveAddress(): boolean {
        return this.isActive
    }
}

export default CompanyAddress