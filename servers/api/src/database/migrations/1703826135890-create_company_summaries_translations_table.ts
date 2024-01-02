import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCompanySummariesTranslationsTable1703826135890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'company_summaries_translations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'language',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title_translated',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content_translated',
            type: 'text',
          },
          {
            name: 'company_summary_id',
            type: 'int',
          },
        ],
        foreignKeys: [
          {
            name: 'companySummaryTranslation_companySummary_fk',
            columnNames: ['company_summary_id'],
            referencedTableName: 'company_summaries',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('company_summaries_translations');
  }
}
