import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCompaniesTable1730123456789 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'companies',
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
              name: 'phone_number',
              type: 'varchar',
              length: 20,
              isNullable: true,
            },
            {
              name: 'company_address',
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
      await queryRunner.query(`CREATE INDEX idx_companies_name ON companies(name)`)
      await queryRunner.query(`CREATE INDEX idx_companies_email ON companies(email)`)
      await queryRunner.query(`CREATE INDEX idx_companies_doc_id ON companies(doc_id)`)
      await queryRunner.query(`CREATE INDEX idx_companies_is_deleted ON companies(is_deleted)`)
      
      // Índice para busca de texto
      await queryRunner.query(`CREATE INDEX idx_companies_search ON companies USING gin(to_tsvector('portuguese', name || ' ' || coalesce(email, '') || ' ' || coalesce(doc_id, '')))`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      // Dropar índices primeiro
      await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_search`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_is_deleted`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_doc_id`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_email`)
      await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_name`)
      
      await queryRunner.dropTable('companies')
    }

}
