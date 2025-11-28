import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInventoryMovementsTable1730280000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'inventory_movements',
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
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'movement_type',
                        type: 'enum',
                        enum: ['IN', 'OUT'],
                        isNullable: false,
                    },
                    {
                        name: 'movement_reason',
                        type: 'enum',
                        enum: [
                            'PURCHASE',
                            'PRODUCTION',
                            'RETURN_FROM_CUSTOMER',
                            'TRANSFER_IN',
                            'ADJUSTMENT_POSITIVE',
                            'CORRECTION',
                            'DONATION_RECEIVED',
                            'SAMPLE_USED',
                            'MANUFACTURING',
                            'ASSEMBLY',
                            'SALE',
                            'DAMAGE',
                            'THEFT',
                            'LOSS',
                            'EXPIRED',
                            'TRANSFER_OUT',
                            'ADJUSTMENT_NEGATIVE',
                            'DONATION_MADE',
                            'SAMPLE_DISTRIBUTED',
                            'SCRAP',
                            'REPAIR',
                            'MAINTENANCE',
                            'RETURN_TO_SUPPLIER',
                            'RECALL',
                            'WEATHER_DAMAGE',
                            'FIRE_DAMAGE',
                            'FLOOD_DAMAGE'
                        ],
                        isNullable: false,
                    },
                    {
                        name: 'quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: false,
                    },
                    {
                        name: 'previous_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: false,
                    },
                    {
                        name: 'current_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 3,
                        isNullable: false,
                    },
                    {
                        name: 'unit_cost',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'total_cost',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'unit_price',
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
                        isNullable: true,
                    },
                    {
                        name: 'reference_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'reference_type',
                        type: 'varchar',
                        length: 50,
                        isNullable: true,
                    },
                    {
                        name: 'reference_number',
                        type: 'varchar',
                        length: 100,
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
                        default: 'CONFIRMED',
                    },
                    {
                        name: 'batch_number',
                        type: 'varchar',
                        length: 100,
                        isNullable: true,
                    },
                    {
                        name: 'expiry_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'serial_numbers',
                        type: 'json',
                        isNullable: true,
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
                        name: 'supplier_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'customer_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'sale_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'purchase_order_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'quality_status',
                        type: 'enum',
                        enum: ['GOOD', 'DAMAGED', 'EXPIRED', 'DEFECTIVE', 'QUARANTINE'],
                        default: 'GOOD',
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
                        name: 'attachment_url',
                        type: 'varchar',
                        length: 500,
                        isNullable: true,
                    },
                    {
                        name: 'approved_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'approved_at',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'cancelled_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'cancelled_at',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                    {
                        name: 'cancellation_reason',
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
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_company_id ON inventory_movements(company_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_user_id ON inventory_movements(user_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_movement_type ON inventory_movements(movement_type)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_movement_reason ON inventory_movements(movement_reason)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_status ON inventory_movements(status)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_reference_type ON inventory_movements(reference_type)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_reference_id ON inventory_movements(reference_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_location ON inventory_movements(location)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_warehouse_zone ON inventory_movements(warehouse_zone)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_quality_status ON inventory_movements(quality_status)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_expiry_date ON inventory_movements(expiry_date)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_batch_number ON inventory_movements(batch_number)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_is_deleted ON inventory_movements(is_deleted)`)
        
        // Índice para busca de texto
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_search ON inventory_movements USING gin(
            to_tsvector('portuguese', notes || ' ' || internal_notes || ' ' || reference_number))`)
        
        // Índice compound para queries comuns
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_product_company ON inventory_movements(product_id, company_id)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_company_type ON inventory_movements(company_id, movement_type)`)
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropar índices primeiro
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_reference`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_company_type`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_product_company`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_search`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_is_deleted`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_created_at`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_batch_number`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_expiry_date`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_quality_status`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_warehouse_zone`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_location`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_reference_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_reference_type`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_status`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_movement_reason`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_movement_type`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_user_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_company_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_product_id`)
        
        await queryRunner.dropTable('inventory_movements')
    }

}