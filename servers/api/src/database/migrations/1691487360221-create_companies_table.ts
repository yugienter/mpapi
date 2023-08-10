import { MigrationInterface, QueryRunner, Table } from 'typeorm';

import { TIME_STAMPS_WITH_SOFT_DELETE } from './common/migration-util';

export class CreateCompaniesTable1691487360221 implements MigrationInterface {
  private tableName = 'companies';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            length: '195',
          },
          {
            name: 'description_1',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description_2',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'country',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'area',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'area_other',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'type_of_business',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'commodity',
            type: 'varchar',
            isNullable: false,
            length: '50',
          },
          {
            name: 'willing_to',
            type: 'boolean',
            isNullable: false,
          },
          {
            name: 'date_of_establishment',
            type: 'varchar',
            isNullable: false,
            length: '25',
          },
          {
            name: 'annual_revenue',
            type: 'decimal(10,2)',
            isNullable: true,
          },
          {
            name: 'annual_profit',
            type: 'decimal(10,2)',
            isNullable: true,
          },
          {
            name: 'number_of_employees',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'sell_of_shares',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'expected_price_of_shares',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'expected_price_of_shares_percent',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'issuance_raise_money',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'issuance_price_of_shares',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'issuance_price_of_shares_percent',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'business_collaboration',
            type: 'boolean',
            default: false,
          },
          {
            name: 'collaboration_detail',
            type: 'text',
            isNullable: true,
          },
          // {
          //   name: 'user_id',
          //   type: 'varchar',
          // },

          ...TIME_STAMPS_WITH_SOFT_DELETE,
        ],
        // foreignKeys: [
        //   {
        //     name: 'users',
        //     referencedTableName: 'users',
        //     referencedColumnNames: ['id'],
        //     columnNames: ['user_id'],
        //     onDelete: 'CASCADE',
        //     onUpdate: 'CASCADE',
        //   },
        // ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE TRIGGER ${this.tableName}_before_insert
        BEFORE INSERT ON ${this.tableName} FOR EACH ROW 
        BEGIN
          IF new.id IS NULL THEN
            SET new.id = uuid();
          END IF;
        END;;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true);
  }
}
