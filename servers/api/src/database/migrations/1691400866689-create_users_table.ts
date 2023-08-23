import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

import { TIME_STAMPS_WITH_SOFT_DELETE } from './common/migration-util';

export class CreateUsersTable1691400866689 implements MigrationInterface {
  private tableName = 'users';
  private UNIQUE_NAME_KEY = 'UQ_users_email_role_key';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            length: '28',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
            length: '50',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            length: '255',
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          ...TIME_STAMPS_WITH_SOFT_DELETE,
        ],
      }),
      true,
    );

    for (const targetColumns of [['name'], ['email']]) {
      await queryRunner.createIndex(this.tableName, new TableIndex({ columnNames: targetColumns }));
    }

    // MySql does not support unique constraints. Use unique index instead.
    await queryRunner.query(`ALTER TABLE ${this.tableName} ADD UNIQUE ${this.UNIQUE_NAME_KEY}(email, role)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true);
  }
}
