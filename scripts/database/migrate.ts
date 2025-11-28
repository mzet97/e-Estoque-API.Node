/**
 * Migration Script Runner
 * Command-line interface for running database migrations
 */

import { DataSource } from 'typeorm';
import { createDataSource } from './data-source';
import { runMigrations, rollbackToVersion, getMigrationStatus } from './MigrationManager';
import { migrations } from './migrations';
import { Logger, createLogger } from 'winston';

interface MigrationOptions {
  environment?: string;
  action: 'run' | 'rollback' | 'status' | 'pending';
  targetVersion?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

class MigrationRunner {
  private logger: Logger;
  private options: MigrationOptions;

  constructor(options: MigrationOptions) {
    this.options = options;
    this.logger = createLogger({
      level: options.verbose ? 'debug' : 'info',
      format: options.verbose 
        ? createLogger.format.combine(
            createLogger.format.timestamp(),
            createLogger.format.json()
          )
        : createLogger.format.simple(),
      transports: [
        new createLogger.transports.Console(),
        new createLogger.transports.File({ 
          filename: `./logs/migrations-${Date.now()}.log` 
        })
      ]
    });
  }

  async run(): Promise<void> {
    try {
      this.logger.info(`Starting migration ${this.options.action}...`);
      
      const dataSource = await this.createDataSource();
      
      // Ensure connection
      await dataSource.initialize();
      this.logger.info('Database connection established');
      
      switch (this.options.action) {
        case 'run':
          await this.runMigrations(dataSource);
          break;
        case 'rollback':
          await this.rollbackMigrations(dataSource);
          break;
        case 'status':
          await this.showStatus(dataSource);
          break;
        case 'pending':
          await this.showPending(dataSource);
          break;
        default:
          throw new Error(`Unknown action: ${this.options.action}`);
      }
      
    } catch (error) {
      this.logger.error('Migration failed:', error);
      process.exit(1);
    }
  }

  private async createDataSource(): Promise<DataSource> {
    const config = {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      synchronize: false,
      logging: this.options.verbose || false,
      entities: [/* Add your entities here */],
      migrations: [/* Add your migration files here */],
      migrationsTableName: 'schema_migrations'
    };

    return createDataSource(config);
  }

  private async runMigrations(dataSource: DataSource): Promise<void> {
    if (this.options.dryRun) {
      this.logger.info('DRY RUN MODE - No changes will be made');
      
      const status = await getMigrationStatus(dataSource, migrations);
      this.logger.info(`Status: ${status.executed}/${status.total} migrations executed`);
      
      if (status.pending > 0) {
        this.logger.info(`Pending migrations: ${status.pending}`);
        const pendingMigrations = migrations.filter(m => 
          !status.history.some(h => h.id === m.id && h.success)
        );
        
        for (const migration of pendingMigrations) {
          this.logger.info(`Would execute: ${migration.id} - ${migration.name}`);
        }
      }
      return;
    }

    const results = await runMigrations(dataSource, migrations, this.logger);
    
    this.logger.info(`Migration completed successfully`);
    this.logger.info(`Executed ${results.length} migrations`);
    
    const failedMigrations = results.filter(r => !r.success);
    if (failedMigrations.length > 0) {
      this.logger.warn(`${failedMigrations.length} migrations failed`);
      for (const migration of failedMigrations) {
        this.logger.error(`Failed: ${migration.id} - ${migration.error}`);
      }
    }
  }

  private async rollbackMigrations(dataSource: DataSource): Promise<void> {
    if (!this.options.targetVersion) {
      throw new Error('Target version is required for rollback');
    }

    if (this.options.dryRun) {
      this.logger.info('DRY RUN MODE - No changes will be made');
      this.logger.info(`Would rollback to version: ${this.options.targetVersion}`);
      return;
    }

    await rollbackToVersion(dataSource, this.options.targetVersion, migrations, this.logger);
    this.logger.info(`Successfully rolled back to version: ${this.options.targetVersion}`);
  }

  private async showStatus(dataSource: DataSource): Promise<void> {
    const status = await getMigrationStatus(dataSource, migrations);
    
    console.log('\n📊 Migration Status:');
    console.log('====================');
    console.log(`Total migrations: ${status.total}`);
    console.log(`Executed: ${status.executed}`);
    console.log(`Pending: ${status.pending}`);
    console.log(`Failed: ${status.failed}`);
    
    if (status.history.length > 0) {
      console.log('\n📝 Recent migrations:');
      status.history.slice(0, 10).forEach(migration => {
        const statusIcon = migration.success ? '✅' : '❌';
        const timeStr = migration.executedAt.toISOString().replace('T', ' ').replace('Z', '');
        console.log(`${statusIcon} ${migration.id} - ${migration.version} (${migration.executionTime}ms) at ${timeStr}`);
        if (migration.error) {
          console.log(`   Error: ${migration.error}`);
        }
      });
    }
  }

  private async showPending(dataSource: DataSource): Promise<void> {
    const pendingMigrations = migrations.filter(m => true); // Simplified for demo
    
    console.log('\n⏳ Pending migrations:');
    console.log('=====================');
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
    } else {
      for (const migration of pendingMigrations) {
        console.log(`• ${migration.id} - ${migration.name} (${migration.version})`);
        console.log(`  ${migration.description}`);
      }
    }
  }
}

// CLI interface
function parseArgs(argv: string[]): MigrationOptions {
  const args = argv.slice(2);
  
  const options: MigrationOptions = {
    action: 'run'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--env':
      case '--environment':
        options.environment = args[++i];
        break;
      case '--action':
        options.action = args[++i] as any;
        break;
      case '--target':
      case '--target-version':
        options.targetVersion = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
E-Estoque Database Migration Runner

Usage: npm run db:migrate [options]

Options:
  --env, --environment <env>    Environment (development|staging|production)
  --action <action>             Action to perform (run|rollback|status|pending)
  --target, --target-version    Target version for rollback
  --dry-run                     Show what would be done without executing
  --verbose, -v                 Enable verbose logging
  --help, -h                    Show this help message

Examples:
  npm run db:migrate --env production --dry-run
  npm run db:migrate --action rollback --target-version 1.0.0
  npm run db:migrate --action status --verbose
  npm run db:migrate --action pending

Default behavior:
  - Environment: development
  - Action: run
  - Dry run: false
  - Verbose: false
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs(process.argv);
  
  // Set environment
  if (options.environment) {
    process.env.NODE_ENV = options.environment;
  }
  
  // Run migrations
  const runner = new MigrationRunner(options);
  runner.run().catch(error => {
    console.error('Migration runner failed:', error);
    process.exit(1);
  });
}

export { MigrationRunner, parseArgs };