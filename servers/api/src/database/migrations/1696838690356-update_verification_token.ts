import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateVerificationToken1696838690356 implements MigrationInterface {
  private tableName = 'email_verification_tokens';
  private newColumn = new TableColumn({
    name: 'type',
    type: 'varchar',
    default: "'verification'", // default value is 'verification'
    isNullable: false,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(this.tableName, this.newColumn);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.tableName, this.newColumn);
  }
}
