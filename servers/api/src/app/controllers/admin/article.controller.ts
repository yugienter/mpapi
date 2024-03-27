import { Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';

import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { Article } from '@/app/models/articles';
import { RolesEnum } from '@/app/models/user';
import { ArticleService } from '@/app/services/articles/articles.services';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('admin/articles')
@UseGuards(RolesGuard)
export class ArticleController implements Coded {
  constructor(
    private readonly articleService: ArticleService, // eslint-disable-next-line no-empty-function
  ) {}

  get code(): string {
    return 'CAR';
  }

  @Get()
  @Roles(RolesEnum.admin)
  async getAllArticles(): Promise<Article[]> {
    return this.articleService.getAllArticles();
  }

  @Get(':id')
  @Roles(RolesEnum.admin)
  async getArticleById(@Param('id') id: number): Promise<Article> {
    return this.articleService.getArticleById(id);
  }

  @Post()
  @Roles(RolesEnum.admin)
  async createArticle(@Body() article: Article): Promise<Article> {
    return this.articleService.createArticle(article);
  }

  @Put(':id')
  @Roles(RolesEnum.admin)
  async updateArticle(@Param('id') id: number, @Body() article: Article): Promise<Article> {
    return this.articleService.updateArticle(id, article);
  }

  @Delete(':id')
  @Roles(RolesEnum.admin)
  async deleteArticle(@Param('id') id: number): Promise<void> {
    return this.articleService.deleteArticle(id);
  }
}
