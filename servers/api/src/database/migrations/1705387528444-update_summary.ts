/* eslint-disable max-len */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSummary1705387528444 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE company_summaries
            ADD COLUMN area VARCHAR(50),
            ADD COLUMN years VARCHAR(50),
            ADD COLUMN number_of_employees VARCHAR(50),
            ADD COLUMN annual_revenue VARCHAR(50);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE company_summaries
            DROP COLUMN area,
            DROP COLUMN years,
            DROP COLUMN number_of_employees,
            DROP COLUMN annual_revenue;
        `);
  }
}
