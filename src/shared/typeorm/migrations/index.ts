/**
 * Migration Registry
 * Central registry for all database migrations
 */

import { Migration } from '../MigrationManager';

// Import all migrations
import { initialSchemaMigration } from './001_InitialSchema';

// Add more migrations here as needed
// import { addUserRolesMigration } from './002_UserRoles';
// import { addProductVariantsMigration } from './003_ProductVariants';
// import { addInventoryTrackingMigration } from './004_InventoryTracking';

// Export all migrations in chronological order
export const migrations: Migration[] = [
  initialSchemaMigration,
  // Add new migrations here...
];

// Migration registry utilities
export const migrationRegistry = {
  // Get migration by ID
  getById(id: string): Migration | undefined {
    return migrations.find(migration => migration.id === id);
  },

  // Get migration by version
  getByVersion(version: string): Migration | undefined {
    return migrations.find(migration => migration.version === version);
  },

  // Get all migrations for a specific module/bounded context
  getByModule(module: string): Migration[] {
    return migrations.filter(migration => 
      migration.id.startsWith(module) || migration.name.toLowerCase().includes(module.toLowerCase())
    );
  },

  // Get migrations within a version range
  getByVersionRange(minVersion: string, maxVersion: string): Migration[] {
    const min = parseInt(minVersion.replace(/\D/g, '')) || 0;
    const max = parseInt(maxVersion.replace(/\D/g, '')) || 999999;
    
    return migrations.filter(migration => {
      const versionNum = parseInt(migration.version.replace(/\D/g, '')) || 0;
      return versionNum >= min && versionNum <= max;
    });
  },

  // Get latest migration
  getLatest(): Migration | undefined {
    return migrations[migrations.length - 1];
  },

  // Get migrations that haven't been applied yet
  getPending(executedIds: string[]): Migration[] {
    return migrations.filter(migration => !executedIds.includes(migration.id));
  },

  // Get migration by name
  getByName(name: string): Migration | undefined {
    return migrations.find(migration => 
      migration.name.toLowerCase().includes(name.toLowerCase())
    );
  },

  // Validate migration dependencies
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const versionMap = new Map<string, Migration>();

    // Check for duplicate versions
    migrations.forEach(migration => {
      if (versionMap.has(migration.version)) {
        errors.push(`Duplicate version: ${migration.version} (${migration.id} and ${versionMap.get(migration.version)?.id})`);
      } else {
        versionMap.set(migration.version, migration);
      }
    });

    // Check for chronological order
    const versions = migrations.map(m => m.version);
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] <= versions[i - 1]) {
        errors.push(`Versions not in chronological order: ${versions[i - 1]} -> ${versions[i]}`);
      }
    }

    // Check for missing required functions
    migrations.forEach(migration => {
      if (typeof migration.up !== 'function') {
        errors.push(`Migration ${migration.id} missing up function`);
      }
      if (typeof migration.down !== 'function') {
        errors.push(`Migration ${migration.id} missing down function`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Generate migration statistics
  getStatistics(): {
    total: number;
    byModule: Record<string, number>;
    byVersion: Record<string, number>;
    totalSize: number; // Estimated size in bytes
  } {
    const byModule: Record<string, number> = {};
    const byVersion: Record<string, number> = {};
    let totalSize = 0;

    migrations.forEach(migration => {
      // Count by module
      const module = migration.id.split('_')[0] || 'core';
      byModule[module] = (byModule[module] || 0) + 1;

      // Count by version
      const majorVersion = migration.version.split('.')[0];
      byVersion[majorVersion] = (byVersion[majorVersion] || 0) + 1;

      // Estimate size (rough calculation)
      totalSize += migration.id.length + migration.name.length + migration.description.length;
    });

    return {
      total: migrations.length,
      byModule,
      byVersion,
      totalSize
    };
  }
} as const;

// Export individual migration references for direct import if needed
export {
  initialSchemaMigration
};