import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCustomersTable1730250000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'customers',
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
                        name: 'doc_id',
                        type: 'varchar',
                        length: 18,
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: 255,
                        isNullable: false,
                        isUnique: true,
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
                        name: 'phone_number',
                        type: 'varchar',
                        length: 20,
                        isNullable: true,
                    },
                    {
                        name: 'customer_address',
                        type: 'jsonb',
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
        await queryRunner.query(`CREATE INDEX idx_customers_name ON customers(name)`)
        await queryRunner.query(`CREATE INDEX idx_customers_email ON customers(email)`)
        await queryRunner.query(`CREATE INDEX idx_customers_doc_id ON customers(doc_id)`)
        await queryRunner.query(`CREATE INDEX idx_customers_phone_number ON customers(phone_number)`)
        await queryRunner.query(`CREATE INDEX idx_customers_is_deleted ON customers(is_deleted)`)
        await queryRunner.query(`CREATE INDEX idx_customers_created_at ON customers(created_at)`)
        
        // Índice para busca de texto
        await queryRunner.query(`CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('portuguese', name || ' ' || coalesce(email, '') || ' ' || coalesce(doc_id, '') || ' ' || coalesce(phone_number, '') || ' ' || coalesce(short_description, '')))`)
        
        // Índice para JSONB (endereço do cliente)
        await queryRunner.query(`CREATE INDEX idx_customers_customer_address ON customers USING gin(customer_address)`)
        
        // Índice para filtros por tipo de pessoa (baseado no tamanho do documento)
        await queryRunner.query(`CREATE INDEX idx_customers_doc_length ON customers(LENGTH(REPLACE(REPLACE(REPLACE(doc_id, '.', ''), '/', ''), '-', '')))`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropar índices primeiro
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_doc_length`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_customer_address`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_search`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_created_at`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_is_deleted`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_phone_number`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_doc_id`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_email`)
        await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_name`)
        
        await queryRunner.dropTable('customers')
    }

}