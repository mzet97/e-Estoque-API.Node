import { Address } from '@shared/entities/Address'
import { Column, Entity } from 'typeorm'

@Entity('companyAddress')
export class CompanyAddress extends Address {
}