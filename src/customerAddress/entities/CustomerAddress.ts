import { Address } from '@shared/entities/Address'
import { Column, Entity } from 'typeorm'

@Entity('CustomerAddress')
export class CustomerAddress extends Address {
}