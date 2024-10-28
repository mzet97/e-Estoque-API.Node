import { Role } from '@roles/entities/Role'

import { DataSource } from 'typeorm'
import { CreateRolesTable1730083148560 } from './migrations/1730083148560-CreateRolesTable'


export const dataSource = new DataSource({
  type: 'sqlite',
  database: './db.sqlite',
  entities: [Role],
  migrations: [
    CreateRolesTable1730083148560

  ],
})
