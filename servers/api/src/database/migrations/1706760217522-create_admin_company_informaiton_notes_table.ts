import { MigrationInterface, QueryRunner, Table } from 'typeorm';

import { TIME_STAMPS_AND_ITS_USERS } from './common/migration-util';

export class CreateAdminCompanyInformaitonNotesTable1706760217522 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admin_company_information_notes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'note',
            type: 'text',
          },
          {
            name: 'company_information_id',
            type: 'int',
          },
          ...TIME_STAMPS_AND_ITS_USERS,
        ],
        foreignKeys: [
          {
            name: 'adminCompanyInformationNote_companyInformation_fk',
            columnNames: ['company_information_id'],
            referencedTableName: 'company_information',
            referencedColumnNames: ['id'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_company_information_notes');
  }
}
