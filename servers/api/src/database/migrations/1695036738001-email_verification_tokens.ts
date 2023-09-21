import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

import { TIME_STAMPS_WITH_SOFT_DELETE } from './common/migration-util';

export class EmailVerificationTokens1695036738001 implements MigrationInterface {
  private tableName = 'email_verification_tokens';

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
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
            length: '28',
          },
          {
            name: 'token',
            type: 'varchar',
            isNullable: false,
            length: '255',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          ...TIME_STAMPS_WITH_SOFT_DELETE,
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true);
  }
}
