import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsPublicToCompanySummaries1704442199153 implements MigrationInterface {
  private tableName = 'company_summaries';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'is_public',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'version',
        type: 'int',
        isNullable: false,
        default: 1,
      }),
    );
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'original_version_id',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'changes_json',
        type: 'json',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'card_order',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'added_to_master_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'company_summaries_translations',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        isNullable: false,
        default: 'CURRENT_TIMESTAMP',
      }),
    );
    await queryRunner.addColumn(
      'company_summaries_translations',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        isNullable: false,
        default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.tableName, 'is_public');
    await queryRunner.dropColumn(this.tableName, 'version');
    await queryRunner.dropColumn(this.tableName, 'original_version_id');
    await queryRunner.dropColumn(this.tableName, 'changes_json');
    await queryRunner.dropColumn(this.tableName, 'card_order');
    await queryRunner.dropColumn(this.tableName, 'added_to_master_at');
    await queryRunner.dropColumn('company_summaries_translations', 'created_at');
    await queryRunner.dropColumn('company_summaries_translations', 'updated_at');
  }
}
