import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInventoryStockTable1730290000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'inventory_stock',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'product_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'total_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'reserved_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'available_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'damaged_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'expired_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'quarantine_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'min_stock_level',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'max_stock_level',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: true,
                    },
                    {
                        name: 'reorder_point',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'safety_stock',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'avg_unit_cost',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'total_investment',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'last_movement_date',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'last_purchase_date',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'last_sale_date',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'stock_valuation_method',
                        type: 'varchar',
                        length: 20,
                        default: 'FIFO',
                    },
                    {
                        name: 'location',
                        type: 'varchar',
                        length: 100,
                        isNullable: true,
                    },
                    {
                        name: 'warehouse_zone',
                        type: 'varchar',
                        length: 50,
                        isNullable: true,
                    },
                    {
                        name: 'abc_classification',
                        type: 'char',
                        length: 1,
                        isNullable: true,
                    },
                    {
                        name: 'lead_time_days',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'stockout_risk_level',
                        type: 'enum',
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                        default: 'LOW',
                    },
                    {
                        name: 'days_of_supply',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'turnover_rate',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'last_count_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'next_count_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'count_variance',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        default: 0,
                    },
                    {
                        name: 'is_tracked',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'allow_negative_stock',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'auto_reorder_enabled',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'notes',
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
        await queryRunner.query(`CREATE UNIQUE INDEX idx_inventory_stock_product_company ON inventory_stock(product_id, company_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_product_id ON inventory_stock(product_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_company_id ON inventory_stock(company_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_location ON inventory_stock(location)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_warehouse_zone ON inventory_stock(warehouse_zone)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_abc_classification ON inventory_stock(abc_classification)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_stockout_risk_level ON inventory_stock(stockout_risk_level)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_total_quantity ON inventory_stock(total_quantity)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_available_quantity ON inventory_stock(available_quantity)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_reserved_quantity ON inventory_stock(reserved_quantity)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_min_stock_level ON inventory_stock(min_stock_level)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_reorder_point ON inventory_stock(reorder_point)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_avg_unit_cost ON inventory_stock(avg_unit_cost)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_total_investment ON inventory_stock(total_investment)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_last_movement_date ON inventory_stock(last_movement_date)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_last_purchase_date ON inventory_stock(last_purchase_date)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_last_sale_date ON inventory_stock(last_sale_date)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_is_tracked ON inventory_stock(is_tracked)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_is_deleted ON inventory_stock(is_deleted)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_created_at ON inventory_stock(created_at)`)
        
        // Índices para alertas de estoque
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_low_stock ON inventory_stock(available_quantity, min_stock_level)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_out_of_stock ON inventory_stock(available_quantity)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_at_risk ON inventory_stock(available_quantity, reorder_point)`)
        
        // Índices para relatórios e análises
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_investment ON inventory_stock(total_investment, abc_classification)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_movement_tracking ON inventory_stock(last_movement_date, total_quantity)`)
        
        // Índice para cálculos de turnover e days of supply
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_turnover_days ON inventory_stock(turnover_rate, days_of_supply)`)
        
        // Índice para contagem de ciclo
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_cycle_count ON inventory_stock(next_count_date, last_count_date)`)
        
        // Índices compostos para queries complexas
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_company_location ON inventory_stock(company_id, location)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_company_risk ON inventory_stock(company_id, stockout_risk_level)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_stock_risk_quantity ON inventory_stock(stockout_risk_level, available_quantity)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropar índices na ordem reversa
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_risk_quantity`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_company_risk`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_company_location`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_cycle_count`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_turnover_days`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_movement_tracking`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_investment`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_at_risk`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_out_of_stock`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_low_stock`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_created_at`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_is_deleted`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_is_tracked`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_last_sale_date`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_last_purchase_date`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_last_movement_date`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_total_investment`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_avg_unit_cost`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_reorder_point`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_min_stock_level`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_reserved_quantity`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_available_quantity`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_total_quantity`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_stockout_risk_level`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_abc_classification`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_warehouse_zone`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_location`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_company_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_product_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_stock_product_company`)
        
        await queryRunner.dropTable('inventory_stock')
    }

}