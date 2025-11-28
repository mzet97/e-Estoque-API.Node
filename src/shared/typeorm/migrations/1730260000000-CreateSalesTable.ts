import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSalesTable1730260000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'sales',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'customer_id', type: 'uuid', isNullable: false },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'sale_number', type: 'varchar', length: 50, isUnique: true, isNullable: false },
                    { name: 'sale_type', type: 'enum', enum: ['RETAIL', 'WHOLESALE', 'CONSIGNMENT', 'SERVICE', 'B2B', 'B2C', 'MARKETPLACE', 'DIRECT_SALE', 'FRANCHISE', 'PARTNERSHIP'], default: 'RETAIL' },
                    { name: 'payment_type', type: 'enum', enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_SLIP', 'BANK_TRANSFER', 'CHECK', 'FINANCED', 'INSTALLMENTS', 'CREDIT', 'EXCHANGE', 'LOYALTY_POINTS', 'DIGITAL_WALLET'], default: 'CASH' },
                    { name: 'status', type: 'enum', enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'], default: 'PENDING' },
                    { name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'discount_value', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'tax_value', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'shipping_value', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'net_amount', type: 'decimal', precision: 15, scale: 2, default: 0 },
                    { name: 'customer_address', type: 'json', isNullable: true },
                    { name: 'sale_date', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
                    { name: 'payment_due_date', type: 'timestamp with time zone', isNullable: true },
                    { name: 'delivery_date', type: 'timestamp with time zone', isNullable: true },
                    { name: 'notes', type: 'text', isNullable: true },
                    { name: 'internal_notes', type: 'text', isNullable: true },
                    { name: 'payment_installments', type: 'integer', default: 1 },
                    { name: 'delivery_method', type: 'varchar', length: 100, isNullable: true },
                    { name: 'tracking_code', type: 'varchar', length: 100, isNullable: true },
                    { name: 'is_deleted', type: 'boolean', default: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', isNullable: true },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            })
        )

        await queryRunner.query(`CREATE INDEX idx_sales_customer_id ON sales(customer_id)`)
        await queryRunner.query(`CREATE INDEX idx_sales_company_id ON sales(company_id)`)
        await queryRunner.query(`CREATE INDEX idx_sales_sale_number ON sales(sale_number)`)
        await queryRunner.query(`CREATE INDEX idx_sales_status ON sales(status)`)
        await queryRunner.query(`CREATE INDEX idx_sales_sale_date ON sales(sale_date)`)
        await queryRunner.query(`CREATE INDEX idx_sales_created_at ON sales(created_at)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_created_at`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_sale_date`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_status`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_sale_number`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_company_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_customer_id`)
        await queryRunner.dropTable('sales')
    }
}