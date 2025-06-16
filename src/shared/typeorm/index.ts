import { Role } from '@roles/entities/Role'
import { DataSource } from 'typeorm'
import path from 'path'
import { CreateRolesTable1730083148560 } from './migrations/1730083148560-CreateRolesTable'


export const dataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', '..', '..', 'database.sqlite'),
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    path.join(__dirname, '..', '..', '**', 'entities', '*.{ts,js}')
  ],
  migrations: [
    path.join(__dirname, 'migrations', '*.{ts,js}')
  ],
})
