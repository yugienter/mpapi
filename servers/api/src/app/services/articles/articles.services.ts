import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Article } from '@/app/models/articles';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>, // eslint-disable-next-line no-empty-function
  ) {}

  async getAllArticles(): Promise<Article[]> {
    try {
      return this.articleRepository.find();
    } catch (error) {
      this.logger.error(`[getAllArticles] Failed to get All Articles: ${error.message}`);
      throw new NotFoundException(`Failed to get All Articles: ${error.message}`);
    }
  }

  async getArticleById(id: number): Promise<Article> {
    return this.articleRepository.findOne({ where: { id: id } });
  }

  async createArticle(article: Article): Promise<Article> {
    return this.articleRepository.save(article);
  }

  async updateArticle(id: number, article: Article): Promise<Article> {
    await this.articleRepository.update(id, article);
    return this.articleRepository.findOne({ where: { id: id } });
  }

  async deleteArticle(id: number): Promise<void> {
    await this.articleRepository.delete(id);
  }
}
