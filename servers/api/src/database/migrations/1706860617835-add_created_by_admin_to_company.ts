import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCreatedByAdminToCompany1706860617835 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('companies', [
      new TableColumn({
        name: 'created_by_admin',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'contact_person_name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'contact_person_email',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    const foreignKey = new TableForeignKey({
      name: 'FK_companies_created_by_admin',
      columnNames: ['created_by_admin'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    });

    await queryRunner.createForeignKey('companies', foreignKey);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('companies', 'FK_companies_created_by_admin');
    await queryRunner.dropColumn('companies', 'created_by_admin');
    await queryRunner.dropColumn('companies', 'contact_person_name');
    await queryRunner.dropColumn('companies', 'contact_person_email');
  }
}
