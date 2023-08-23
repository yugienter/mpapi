import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util';

export class CreateCompaniesUsersTable1691488611876 implements MigrationInterface {
  private tableName = 'companies_users';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'position_of_user',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'user_id',
            isNullable: false,
            type: 'varchar',
            length: '50',
          },
          {
            name: 'company_id',
            isNullable: false,
            type: 'varchar',
            length: '50',
          },
          ...TIME_STAMPS_AND_ITS_USERS,
        ],
        foreignKeys: [
          {
            name: 'user',
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            columnNames: ['user_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'company',
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            columnNames: ['company_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
    );

    for (const targetColumns of [['user_id'], ['company_id'], ['position_of_user']]) {
      await queryRunner.createIndex(
        new Table({
          name: this.tableName,
        }),
        new TableIndex({
          columnNames: targetColumns,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true);
  }
}
