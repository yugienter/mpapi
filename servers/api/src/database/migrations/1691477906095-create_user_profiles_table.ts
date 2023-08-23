import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util';

export class createUserProfilesTable1691477906095 implements MigrationInterface {
  private tableName = 'user_profiles';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name_sei',
            type: 'varchar',
            isNullable: true,
            length: '45',
          },
          {
            name: 'name_mei',
            type: 'varchar',
            isNullable: true,
            length: '45',
          },
          {
            name: 'kana_name_sei',
            type: 'varchar',
            isNullable: true,
            length: '45',
          },
          {
            name: 'kana_name_mei',
            type: 'varchar',
            isNullable: true,
            length: '45',
          },
          {
            name: 'birthday',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'gender_type',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          ...TIME_STAMPS_AND_ITS_USERS,
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      new Table({ name: this.tableName }),
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true);
  }
}
