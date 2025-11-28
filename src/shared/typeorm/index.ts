import { DataSource } from 'typeorm'
import path from 'path'
import 'dotenv/config'

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'estoque_user',
  password: process.env.DB_PASSWORD || 'estoque_password_123',
  database: process.env.DB_NAME || 'estoque_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities: [
    path.join(__dirname, '..', '..', '**', 'entities', '*.{ts,js}')
  ],
  migrations: [
    path.join(__dirname, 'migrations', '*.{ts,js}')
  ],
})

// Utility function to get connection
export async function getDataSource(): Promise<DataSource> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }
  return dataSource
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (dataSource.isInitialized) {
    await dataSource.destroy()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (dataSource.isInitialized) {
    await dataSource.destroy()
  }
  process.exit(0)
})
