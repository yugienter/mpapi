import { MigrationInterface, QueryRunner } from 'typeorm';

import { TypeOfBusinessEnum } from '@/app/models/company_information';

export class UpdateTypeOfBusinessEnum1708685168205 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [key, value] of Object.entries(TypeOfBusinessEnum)) {
      await queryRunner.query(
        `UPDATE company_information SET general_business_type = ? WHERE general_business_type = ?`,
        [key, value],
      );
      await queryRunner.query(`UPDATE company_summaries SET type_of_business = ? WHERE type_of_business = ?`, [
        key,
        value,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [key, value] of Object.entries(TypeOfBusinessEnum)) {
      await queryRunner.query(
        `UPDATE company_information SET general_business_type = ? WHERE general_business_type = ?`,
        [value, key],
      );
      await queryRunner.query(`UPDATE company_summaries SET type_of_business = ? WHERE type_of_business = ?`, [
        value,
        key,
      ]);
    }
  }
}
