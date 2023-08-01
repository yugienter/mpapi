import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex
} from 'typeorm'

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util'


const tableName = 'users'

export class createUsersTable1651025821000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            length: '28',
            comment: 'ユーザID'
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
            length: '50',
            comment: 'ユーザ名'
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            length: '255',
            comment: 'メールアドレス'
          },
          {
            name: 'is_admin',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: '削除したかどうか'
          },
          ...TIME_STAMPS_AND_ITS_USERS,
        ],
      }),
      true,
    )

    for (const targetColumns of [
      ['name'],
    ]) {
      await queryRunner.createIndex(
        new Table({
          name: tableName,
        }),
        new TableIndex({
          columnNames: targetColumns,
        })
      )
    }

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
