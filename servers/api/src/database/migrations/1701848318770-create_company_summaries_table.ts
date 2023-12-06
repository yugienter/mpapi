import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util';

export class CreateCompanySummariesTable1701848318770 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'company_summaries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'company_information_id',
            type: 'int',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'type_of_business',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },

          ...TIME_STAMPS_AND_ITS_USERS,
        ],
        foreignKeys: [
          {
            name: 'companySummary_companyInformation_fk',
            columnNames: ['company_information_id'],
            referencedTableName: 'company_information',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
      true,
    );

    await queryRunner.dropForeignKey('company_information', 'companyInformation_company_fk');

    await queryRunner.createForeignKey(
      'company_information',
      new TableForeignKey({
        name: 'companyInformation_company_fk',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('company_summaries', true);
    await queryRunner.dropForeignKey('company_information', 'companyInformation_company_fk');
    await queryRunner.createForeignKey(
      'company_information',
      new TableForeignKey({
        name: 'companyInformation_company_fk',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }
}
