import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/Customer';
import { SaleProduct } from './SaleProduct';
import { SaleType } from './SaleType';
import { PaymentType } from './PaymentType';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTax: number;

  @Column({ type: 'varchar', length: 50 })
  saleType: SaleType;

  @Column({ type: 'varchar', length: 50 })
  paymentType: PaymentType;

  @Column({ type: 'datetime', nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'datetime' })
  saleDate: Date;

  @Column({ type: 'datetime', nullable: true })
  paymentDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @Column({ type: 'uuid' })
  idCustomer: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'idCustomer' })
  customer: Customer;

  @OneToMany(() => SaleProduct, (saleProduct) => saleProduct.sale)
  saleProducts: SaleProduct[];
}