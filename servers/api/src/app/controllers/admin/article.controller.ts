import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';

import { CreateArticleDto, UpdateArticleDto } from '@/app/controllers/dto/article.dto';
import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { Article } from '@/app/models/articles';
import { RolesEnum } from '@/app/models/user';
import { ArticleService } from '@/app/services/articles/articles.services';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

import { ArticleResponse } from '../viewmodels/article.response';

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
  async getArticleById(@Param('id') id: number): Promise<ArticleResponse> {
    return this.articleService.getArticleById(id);
  }

  @Post()
  @Roles(RolesEnum.admin)
  async createArticle(@Body() article: CreateArticleDto, @Req() request): Promise<ArticleResponse> {
    const authorId = request.raw.user.uid;
    return this.articleService.createArticle(article, authorId);
  }

  @Put(':id')
  @Roles(RolesEnum.admin)
  async updateArticle(
    @Param('id') id: number,
    @Body() article: UpdateArticleDto,
    @Req() request,
  ): Promise<ArticleResponse> {
    const authorId = request.raw.user.uid;
    return this.articleService.updateArticle(id, article, authorId);
  }

  @Delete(':id')
  @Roles(RolesEnum.admin)
  async deleteArticle(@Param('id') id: number): Promise<void> {
    return this.articleService.deleteArticle(id);
  }
}
