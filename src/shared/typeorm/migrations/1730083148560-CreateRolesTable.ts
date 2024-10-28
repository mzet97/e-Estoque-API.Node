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
            },
            {
              name: 'name',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'is_deleted',
              type: 'integer',
              default: 0,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: `(datetime('now'))`,
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
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
