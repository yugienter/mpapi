import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { RolesGuard } from '@/app/guards/roles.guard';
import { Article } from '@/app/models/articles';
import { ArticleService } from '@/app/services/articles/articles.services';
import { Coded } from '@/app/utils/coded';
import { MpplatformApiDefault } from '@/app/utils/decorators';

import { ArticleResponse } from '../viewmodels/article.response';

@MpplatformApiDefault()
@Controller('companies/articles')
@UseGuards(RolesGuard)
export class ArticleCompaniesController implements Coded {
  constructor(
    private readonly articleService: ArticleService, // eslint-disable-next-line no-empty-function
  ) {}

  get code(): string {
    return 'CAR';
  }

  @Get()
  async getAllArticles(@Query('limit') limit?: number): Promise<Article[]> {
    return this.articleService.getManyArticlesForCompanySide(limit);
  }

  @Get(':id')
  async getArticleById(@Param('id') id: number): Promise<ArticleResponse> {
    return this.articleService.getArticleByIdForCompanySide(id);
  }
}
