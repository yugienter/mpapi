import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

import { TIME_STAMPS_AND_ITS_USERS, TIME_STAMPS_WITH_SOFT_DELETE } from './common/migration-util';

export class UpdateCompaniesAndRelated1700219094597 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('uploaded_files', 'file_attachments');
    await queryRunner.dropForeignKey('companies_users', 'company');
    await queryRunner.dropForeignKey('companies_users', 'user');
    await queryRunner.dropTable('companies_users', true);
    await queryRunner.dropForeignKey('file_attachments', 'FK_882efc26a8d783520002d0b88f9'); // company
    await queryRunner.dropForeignKey('file_attachments', 'FK_dbd75c6a10be3314708a397da86'); // user
    await queryRunner.dropColumn('file_attachments', 'company_id');

    const newForeignKey = new TableForeignKey({
      name: 'fileAttachments_user-fk',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    });
    await queryRunner.createForeignKey('file_attachments', newForeignKey);

    await queryRunner.dropTable('companies', true);

    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'position',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: true,
          },
          ...TIME_STAMPS_WITH_SOFT_DELETE,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'company_user_fk',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'company_information',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'company_id',
            type: 'int',
          },
          {
            name: 'general_shareholder_structure',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'general_management_structure',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'general_year_of_establishment',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'general_headquarter',
            type: 'varchar',
            isNullable: true,
            length: '255',
          },
          {
            name: 'general_business_type',
            type: 'varchar',
            isNullable: true,
            length: '50',
          },
          {
            name: 'general_business_location_country',
            type: 'varchar',
            isNullable: true,
            length: '50',
          },
          {
            name: 'general_business_location_area',
            type: 'varchar',
            isNullable: true,
            length: '50',
          },
          {
            name: 'general_number_of_employees',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'business_overview',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_main_products_services',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_major_clients',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_major_suppliers',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_future_growth_projection',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'financial_current_valuation',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'transaction_sell_shares_percentage',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'transaction_sell_shares_amount',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'transaction_issue_shares_percentage',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'transaction_issue_shares_amount',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'transaction_other_details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reason_deal_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reason_deal_timeline',
            type: 'text',
            isNullable: true,
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
            name: 'companyInformation_company_fk',
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      'file_attachments',
      new TableColumn({
        name: 'company_information_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'file_attachments',
      new TableForeignKey({
        name: 'fileAttachments_companyInformation_fk',
        columnNames: ['company_information_id'],
        referencedTableName: 'company_information',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'company_financial_data',
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
            name: 'year',
            type: 'int',
          },
          {
            name: 'sales',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'profit',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'EBITDA',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'net_asset',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'net_debt',
            type: 'bigint',
            isNullable: true,
          },
          ...TIME_STAMPS_AND_ITS_USERS,
        ],
        foreignKeys: [
          {
            name: 'companyFinancialData_companyInformation_fk',
            columnNames: ['company_information_id'],
            referencedTableName: 'company_information',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('file_attachments', 'uploaded_files');
    await queryRunner.dropTable('company_financial_data', true);
    await queryRunner.dropTable('company_information', true);
  }
}
