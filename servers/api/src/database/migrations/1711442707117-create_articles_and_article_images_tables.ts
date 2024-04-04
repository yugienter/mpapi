import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

import { ArticleStatus } from '@/app/models/articles';

import { TIME_STAMPS_WITH_SOFT_DELETE } from './common/migration-util';

export class CreateArticlesAndArticleImagesTable1711442707117 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'articles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(ArticleStatus),
            default: `'${ArticleStatus.DRAFT}'`,
          },
          {
            name: 'author_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_author_article',
            columnNames: ['author_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'article_images',
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
            length: '500',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'path',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'article_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['UNUSED', 'USED'],
            default: `'UNUSED'`,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: false,
          },
          ...TIME_STAMPS_WITH_SOFT_DELETE,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_article_images_users',
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          }),
          new TableForeignKey({
            name: 'FK_article_images_articles',
            columnNames: ['article_id'],
            referencedTableName: 'articles',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('article_images');
    await queryRunner.dropTable('articles');
  }
}
