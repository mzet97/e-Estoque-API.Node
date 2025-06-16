import { BaseEntity } from '@shared/entities/BaseEntity'
import { CompanyAddress } from 'src/companyAddress/entities/CompanyAddress'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity('company')
export class Company extends BaseEntity {

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
    idCompanyAddress: string

    @ManyToOne(() => CompanyAddress)
    @JoinColumn({ name: 'idCompanyAddress' })
    companyAddress: CompanyAddress
}