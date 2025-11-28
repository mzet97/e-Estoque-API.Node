import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSaleProductsTable1730270000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'sale_products',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'sale_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'product_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'service_id',
                        type: 'uuid',
                        isNullable: true,
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
                        name: 'sku',
                        type: 'varchar',
                        length: 50,
                        isNullable: true,
                    },
                    {
                        name: 'product_type',
                        type: 'enum',
                        enum: ['PRODUCT', 'SERVICE', 'DISCOUNT', 'TAX', 'SHIPPING'],
                        default: 'PRODUCT'
                    },
                    {
                        name: 'quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 1
                    },
                    {
                        name: 'unit_price',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'cost_price',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'total_price',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'total_cost',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0
                    },
                    {
                        name: 'discount_value',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0
                    },
                    {
                        name: 'tax_rate',
                        type: 'decimal',
                        precision: 5,
                        scale: 4,
                        default: 0
                    },
                    {
                        name: 'tax_value',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0
                    },
                    {
                        name: 'net_price',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'inventory_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'reserved_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0
                    },
                    {
                        name: 'available_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'weight',
                        type: 'decimal',
                        precision: 8,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'length',
                        type: 'decimal',
                        precision: 8,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'width',
                        type: 'decimal',
                        precision: 8,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'height',
                        type: 'decimal',
                        precision: 8,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'delivery_date',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'tracking_code',
                        type: 'varchar',
                        length: 100,
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'internal_notes',
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

        // Criar índices para performance
        await queryRunner.query(`CREATE INDEX idx_sale_products_sale_id ON sale_products(sale_id)`)
        await queryRunner.query(`CREATE INDEX idx_sale_products_product_id ON sale_products(product_id)`)
        await queryRunner.query(`CREATE INDEX idx_sale_products_product_type ON sale_products(product_type)`)
        await queryRunner.query(`CREATE INDEX idx_sale_products_sku ON sale_products(sku)`)
        await queryRunner.query(`CREATE INDEX idx_sale_products_is_deleted ON sale_products(is_deleted)`)
        await queryRunner.query(`CREATE INDEX idx_sale_products_created_at ON sale_products(created_at)`)
        
        // Foreign key constraint
        await queryRunner.query(`ALTER TABLE sale_products ADD CONSTRAINT fk_sale_products_sale_id 
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`)
        
        // Índice para busca de texto
        await queryRunner.query(`CREATE INDEX idx_sale_products_search ON sale_products USING gin(
            to_tsvector('portuguese', name || ' ' || coalesce(description, '') || ' ' || coalesce(sku, '')))`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropar foreign key constraint primeiro
        await queryRunner.query(`ALTER TABLE sale_products DROP CONSTRAINT IF EXISTS fk_sale_products_sale_id`)
        
        // Dropar índices
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_search`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_created_at`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_is_deleted`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_sku`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_product_type`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_product_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sale_products_sale_id`)
        
        await queryRunner.dropTable('sale_products')
    }

}