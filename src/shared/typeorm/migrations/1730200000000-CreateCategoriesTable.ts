import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCategoriesTable1730200000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'categories',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'name',
              type: 'varchar',
              length: 255,
              isNullable: false,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'short_description',
              type: 'varchar',
              length: 500,
              isNullable: true,
            },
            {
              name: 'parent_category_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'sort_order',
              type: 'integer',
              default: 0,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'slug',
              type: 'varchar',
              length: 255,
              isNullable: true,
              unique: true,
            },
            {
              name: 'meta_title',
              type: 'varchar',
              length: 255,
              isNullable: true,
            },
            {
              name: 'meta_description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'is_deleted',
              type: 'boolean',
              default: false,
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'deleted_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
          ],
        }),
      )

      // Create indexes for performance
      await queryRunner.query(`CREATE INDEX idx_categories_name ON categories(name)`)
      await queryRunner.query(`CREATE INDEX idx_categories_parent_id ON categories(parent_category_id)`)
      await queryRunner.query(`CREATE INDEX idx_categories_slug ON categories(slug)`)
      await queryRunner.query(`CREATE INDEX idx_categories_is_active ON categories(is_active)`)
      await queryRunner.query(`CREATE INDEX idx_categories_is_deleted ON categories(is_deleted)`)
      
      // Add foreign key constraint
      await queryRunner.query(`ALTER TABLE categories ADD CONSTRAINT fk_categories_parent_id FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      // Drop foreign key constraint first
      await queryRunner.query(`ALTER TABLE categories DROP CONSTRAINT fk_categories_parent_id`)
      
      // Drop indexes
      await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_is_deleted`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_is_active`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_slug`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_parent_id`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_name`)
      
      await queryRunner.dropTable('categories')
    }

}
