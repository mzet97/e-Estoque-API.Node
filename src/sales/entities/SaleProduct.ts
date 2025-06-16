import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/Product';
import { Sale } from './Sale';

@Entity('sale_products')
export class SaleProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @Column({ type: 'uuid' })
  idProduct: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'idProduct' })
  product: Product;

  @Column({ type: 'uuid' })
  idSale: string;

  @ManyToOne(() => Sale, (sale) => sale.saleProducts)
  @JoinColumn({ name: 'idSale' })
  sale: Sale;
}