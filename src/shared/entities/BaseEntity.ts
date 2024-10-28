import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn, Column } from "typeorm"
import { v4 as uuidv4 } from 'uuid'

export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'is_deleted', type: 'integer', default: 0 }) // Define o nome da coluna como "is_deleted"
  isDeleted: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt?: Date

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date

  constructor() {
    if (!this.id) {
      this.id = uuidv4()
    }
  }
}
