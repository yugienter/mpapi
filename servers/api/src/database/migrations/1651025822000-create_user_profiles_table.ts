import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm'

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util'

const tableName = 'user_profiles'

export class createUserProfilesTable1651025822000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isPrimary: true,
            length: '28',
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
            comment: '誕生日'
          },
          {
            name: 'gender_type',
            type: 'varchar',
            length: '1',
            isNullable: true,
            comment: '性別'
          },
          ... TIME_STAMPS_AND_ITS_USERS,
        ],
      }),
      true,
    )

    await queryRunner.createForeignKey(
      new Table({
        name: tableName,
      }),
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(
      new Table({
        name: tableName,
      }),
      true,
    )
  }

}
