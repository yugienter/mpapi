import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateRoleOrder1703661485014 implements MigrationInterface {
  private tableName = 'users';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'role_order_temp',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
        UPDATE ${this.tableName} u
        INNER JOIN (
          SELECT 
            id, 
            ROW_NUMBER() OVER (PARTITION BY role ORDER BY created_at) as row_num
          FROM ${this.tableName}
        ) as ordered_users
        ON u.id = ordered_users.id
        SET u.role_order_temp = ordered_users.row_num;
      `);

    await queryRunner.query(`
        UPDATE ${this.tableName}
        SET role_order = role_order_temp;
      `);

    await queryRunner.dropColumn(this.tableName, 'role_order_temp');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN role_order;
    `);
  }
}
