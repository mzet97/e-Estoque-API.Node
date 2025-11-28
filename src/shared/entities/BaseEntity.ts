import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn, Column } from "typeorm"
import { v4 as uuidv4 } from 'uuid'

export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt?: Date

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp with time zone" })
  deletedAt?: Date

  constructor() {
    if (!this.id) {
      this.id = uuidv4()
    }
  }
}
