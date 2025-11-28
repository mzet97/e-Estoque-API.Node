/**
 * Database Migration Manager
 * Handles database schema migrations for E-Estoque API
 */

import { DataSource } from 'typeorm';
import { Logger } from 'winston';
import { config } from '../../config';

// Migration interface
export interface Migration {
  id: string;
  name: string;
  version: string;
  description: string;
  up: (dataSource: DataSource, logger: Logger) => Promise<void>;
  down: (dataSource: DataSource, logger: Logger) => Promise<void>;
  checksum: string;
  createdAt: Date;
  executedAt?: Date;
}

// Migration status
export interface MigrationStatus {
  id: string;
  name: string;
  version: string;
  executedAt: Date;
  executionTime: number; // in milliseconds
  success: boolean;
  error?: string;
}

// Migration history table structure
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    checksum VARCHAR(64) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    rollback_sql TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

// Create migration table
export async function createMigrationTable(dataSource: DataSource, logger: Logger): Promise<void> {
  try {
    logger.info('Creating migration table...');
    await dataSource.query(MIGRATION_TABLE);
    logger.info('Migration table created successfully');
  } catch (error) {
    logger.error('Failed to create migration table:', error);
    throw error;
  }
}

// Get migration history
export async function getMigrationHistory(dataSource: DataSource): Promise<MigrationStatus[]> {
  const query = `
    SELECT 
      id,
      name,
      version,
      executed_at as executedAt,
      execution_time as executionTime,
      success,
      error_message as error
    FROM schema_migrations 
    ORDER BY executed_at DESC
  `;
  
  return dataSource.query(query);
}

// Check if migration exists
export async function migrationExists(dataSource: DataSource, migrationId: string): Promise<boolean> {
  const query = 'SELECT COUNT(*) as count FROM schema_migrations WHERE id = ?';
  const result = await dataSource.query(query, [migrationId]);
  return result[0].count > 0;
}

// Execute single migration
export async function executeMigration(
  dataSource: DataSource,
  migration: Migration,
  logger: Logger
): Promise<MigrationStatus> {
  const startTime = Date.now();
  let status: MigrationStatus;

  try {
    logger.info(`Executing migration: ${migration.id} - ${migration.name}`);
    
    // Execute the migration
    await migration.up(dataSource, logger);
    
    const executionTime = Date.now() - startTime;
    
    // Record successful migration
    status = {
      id: migration.id,
      name: migration.name,
      version: migration.version,
      executedAt: new Date(),
      executionTime,
      success: true
    };
    
    await recordMigration(dataSource, status);
    logger.info(`Migration executed successfully: ${migration.id} (${executionTime}ms)`);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    status = {
      id: migration.id,
      name: migration.name,
      version: migration.version,
      executedAt: new Date(),
      executionTime,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    await recordMigration(dataSource, status);
    logger.error(`Migration failed: ${migration.id}`, error);
    throw error;
  }
  
  return status;
}

// Record migration in history
async function recordMigration(dataSource: DataSource, status: MigrationStatus): Promise<void> {
  const query = `
    INSERT INTO schema_migrations (
      id, name, version, executed_at, execution_time, success, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  await dataSource.query(query, [
    status.id,
    status.name,
    status.version,
    status.executedAt,
    status.executionTime,
    status.success,
    status.error || null
  ]);
}

// Rollback migration
export async function rollbackMigration(
  dataSource: DataSource,
  migrationId: string,
  logger: Logger
): Promise<void> {
  try {
    logger.info(`Rolling back migration: ${migrationId}`);
    
    // Get migration details
    const migrationQuery = 'SELECT * FROM schema_migrations WHERE id = ?';
    const migrationResult = await dataSource.query(migrationQuery, [migrationId]);
    
    if (migrationResult.length === 0) {
      throw new Error(`Migration not found: ${migrationId}`);
    }
    
    const migration = migrationResult[0];
    
    if (!migration.rollback_sql) {
      throw new Error(`No rollback SQL found for migration: ${migrationId}`);
    }
    
    // Execute rollback
    await dataSource.query(migration.rollback_sql);
    
    // Mark as rolled back
    await dataSource.query(
      'UPDATE schema_migrations SET rollback_executed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [migrationId]
    );
    
    logger.info(`Migration rolled back successfully: ${migrationId}`);
    
  } catch (error) {
    logger.error(`Failed to rollback migration: ${migrationId}`, error);
    throw error;
  }
}

// Get pending migrations
export async function getPendingMigrations(
  dataSource: DataSource,
  migrations: Migration[]
): Promise<Migration[]> {
  const executedMigrations = await getMigrationHistory(dataSource);
  const executedIds = new Set(executedMigrations.map(m => m.id));
  
  return migrations.filter(migration => !executedIds.has(migration.id));
}

// Execute all pending migrations
export async function runMigrations(
  dataSource: DataSource,
  migrations: Migration[],
  logger: Logger
): Promise<MigrationStatus[]> {
  await createMigrationTable(dataSource, logger);
  
  const pendingMigrations = await getPendingMigrations(dataSource, migrations);
  
  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations found');
    return [];
  }
  
  logger.info(`Found ${pendingMigrations.length} pending migrations`);
  
  const results: MigrationStatus[] = [];
  
  for (const migration of pendingMigrations) {
    try {
      const status = await executeMigration(dataSource, migration, logger);
      results.push(status);
    } catch (error) {
      logger.error(`Migration failed, stopping execution: ${migration.id}`);
      throw error;
    }
  }
  
  logger.info(`Successfully executed ${results.length} migrations`);
  return results;
}

// Rollback migrations to target version
export async function rollbackToVersion(
  dataSource: DataSource,
  targetVersion: string,
  migrations: Migration[],
  logger: Logger
): Promise<void> {
  const history = await getMigrationHistory(dataSource);
  const executedMigrations = history.filter(h => h.success).sort((a, b) => 
    b.executedAt.getTime() - a.executedAt.getTime()
  );
  
  const targetMigration = migrations.find(m => m.version === targetVersion);
  if (!targetMigration) {
    throw new Error(`Target migration not found: ${targetVersion}`);
  }
  
  const targetIndex = executedMigrations.findIndex(m => m.version === targetVersion);
  if (targetIndex === -1) {
    logger.info(`Migration ${targetVersion} not found in history, no rollback needed`);
    return;
  }
  
  // Rollback migrations newer than target
  for (let i = 0; i < targetIndex; i++) {
    const migrationToRollback = executedMigrations[i];
    await rollbackMigration(dataSource, migrationToRollback.id, logger);
  }
}

// Generate migration checksum
export function generateChecksum(sql: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sql).digest('hex');
}

// Validate migration
export function validateMigration(migration: Migration): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!migration.id || typeof migration.id !== 'string') {
    errors.push('Migration ID is required');
  }
  
  if (!migration.name || typeof migration.name !== 'string') {
    errors.push('Migration name is required');
  }
  
  if (!migration.version || typeof migration.version !== 'string') {
    errors.push('Migration version is required');
  }
  
  if (!migration.up || typeof migration.up !== 'function') {
    errors.push('Migration up function is required');
  }
  
  if (!migration.down || typeof migration.down !== 'function') {
    errors.push('Migration down function is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Migration status reporting
export async function getMigrationStatus(
  dataSource: DataSource,
  migrations: Migration[]
): Promise<{
  total: number;
  executed: number;
  pending: number;
  failed: number;
  history: MigrationStatus[];
}> {
  const history = await getMigrationHistory(dataSource);
  const executedIds = new Set(history.filter(h => h.success).map(h => h.id));
  
  const executed = history.filter(h => h.success).length;
  const failed = history.filter(h => !h.success).length;
  const pending = migrations.length - executed;
  
  return {
    total: migrations.length,
    executed,
    pending: Math.max(0, pending),
    failed,
    history
  };
}