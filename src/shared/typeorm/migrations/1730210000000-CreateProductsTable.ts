import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateProductsTable1730210000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'products',
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
              isNullable: false,
            },
            {
              name: 'short_description',
              type: 'varchar',
              length: 500,
              isNullable: false,
            },
            {
              name: 'price',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'cost_price',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'dimensions',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'weight',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'images',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'sku',
              type: 'varchar',
              length: 100,
              isNullable: true,
              unique: true,
            },
            {
              name: 'barcode',
              type: 'varchar',
              length: 50,
              isNullable: true,
              unique: true,
            },
            {
              name: 'stock_quantity',
              type: 'integer',
              default: 0,
            },
            {
              name: 'min_stock_level',
              type: 'integer',
              default: 0,
            },
            {
              name: 'max_stock_level',
              type: 'integer',
              isNullable: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'is_featured',
              type: 'boolean',
              default: false,
            },
            {
              name: 'is_digital',
              type: 'boolean',
              default: false,
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
              name: 'id_category',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'id_company',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'reserved_quantity',
              type: 'integer',
              default: 0,
            },
            {
              name: 'available_quantity',
              type: 'integer',
              default: 0,
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
      await queryRunner.query(`CREATE INDEX idx_products_name ON products(name)`)
      await queryRunner.query(`CREATE INDEX idx_products_price ON products(price)`)
      await queryRunner.query(`CREATE INDEX idx_products_sku ON products(sku)`)
      await queryRunner.query(`CREATE INDEX idx_products_barcode ON products(barcode)`)
      await queryRunner.query(`CREATE INDEX idx_products_category_id ON products(id_category)`)
      await queryRunner.query(`CREATE INDEX idx_products_company_id ON products(id_company)`)
      await queryRunner.query(`CREATE INDEX idx_products_is_active ON products(is_active)`)
      await queryRunner.query(`CREATE INDEX idx_products_is_featured ON products(is_featured)`)
      await queryRunner.query(`CREATE INDEX idx_products_is_deleted ON products(is_deleted)`)
      await queryRunner.query(`CREATE INDEX idx_products_slug ON products(slug)`)
      
      // Stock-related indexes
      await queryRunner.query(`CREATE INDEX idx_products_stock_quantity ON products(stock_quantity)`)
      await queryRunner.query(`CREATE INDEX idx_products_available_quantity ON products(available_quantity)`)
      
      // Full-text search index for Portuguese
      await queryRunner.query(`CREATE INDEX idx_products_search ON products USING gin(to_tsvector('portuguese', name || ' ' || coalesce(description, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(barcode, '')))`)
      
      // Add foreign key constraints
      await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (id_category) REFERENCES categories(id) ON DELETE SET NULL`)
      await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT fk_products_company_id FOREIGN KEY (id_company) REFERENCES companies(id) ON DELETE CASCADE`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      // Drop foreign key constraints first
      await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT fk_products_company_id`)
      await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT fk_products_category_id`)
      
      // Drop indexes
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_search`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_available_quantity`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_stock_quantity`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_slug`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_deleted`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_featured`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_company_id`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_category_id`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_barcode`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_price`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_products_name`)
      
      await queryRunner.dropTable('products')
    }

}
