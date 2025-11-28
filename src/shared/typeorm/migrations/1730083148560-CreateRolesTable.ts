import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRolesTable1730083148560 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'roles',
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
              isUnique: true,
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropTable('roles')
    }

}
