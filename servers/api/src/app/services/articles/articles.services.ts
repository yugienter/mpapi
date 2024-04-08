import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';

import { CreateArticleDto, UpdateArticleDto } from '@/app/controllers/dto/article.dto';
import { ArticleResponse } from '@/app/controllers/viewmodels/article.response';
import { ArticleImage, ImageStatus } from '@/app/models/article_images';
import { Article, ArticleStatus } from '@/app/models/articles';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(ArticleImage)
    private articleImageRepository: Repository<ArticleImage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // eslint-disable-next-line no-empty-function
  ) {}

  async getAllArticles(): Promise<Article[]> {
    this.logger.debug('[getAllArticles]');
    try {
      return this.articleRepository.find({ relations: ['user'] });
    } catch (error) {
      this.logger.error(`Failed to get All Articles: ${error.message}`);
      throw new NotFoundException(`Failed to get All Articles: ${error.message}`);
    }
  }

  async getArticleById(id: number): Promise<ArticleResponse> {
    this.logger.debug(`[getArticleById]: ${id}`);
    try {
      const article = await this.articleRepository.findOne({ where: { id }, relations: ['user', 'articleImage'] });

      if (!article) {
        throw new NotFoundException(`Article with ID ${id} not found`);
      }

      return new ArticleResponse(article);
    } catch (error) {
      this.logger.error(`Failed to get Article by ID ${id}: ${error.message}`);
      throw new NotFoundException(`Failed to get Article by ID ${id}: ${error.message}`);
    }
  }

  async createArticle(articleDto: CreateArticleDto, authorId: string): Promise<ArticleResponse> {
    this.logger.debug('[createArticle]');
    try {
      const articleResponse = await this.articleRepository.manager.transaction(async (transactionalEntityManager) => {
        const author = await transactionalEntityManager.findOne(User, { where: { id: authorId } });
        if (!author) {
          throw new Error('Author not found');
        }

        let article = transactionalEntityManager.create(Article, { ...articleDto, user: author });

        article = await transactionalEntityManager.save(Article, article);

        const uploadedImageIds = articleDto.uploadedImageIds || [];
        const usedImageIds = articleDto.usedImageIds || [];
        const imageIdsToUpdate = uploadedImageIds.concat(usedImageIds);

        const articleImagesUpdated = [];

        if (imageIdsToUpdate.length > 0) {
          const imagesToUpdate = await transactionalEntityManager.find(ArticleImage, {
            where: { id: In(imageIdsToUpdate) },
          });
          imagesToUpdate.forEach((image) => {
            image.status = usedImageIds.includes(image.id) ? ImageStatus.USED : ImageStatus.UNUSED;
            image.article = article;
            articleImagesUpdated.push(image);
          });
          await transactionalEntityManager.save(ArticleImage, imagesToUpdate);
        }

        article.articleImage = articleImagesUpdated;
        article.articleImage.forEach((image) => {
          delete image.article;
        });

        return new ArticleResponse(article);
      });

      return articleResponse;
    } catch (error) {
      this.logger.error(`Failed to create Article: ${error.message}`);
      throw new Error(`Failed to create Article: ${error.message}`);
    }
  }

  async updateArticle(id: number, articleDto: UpdateArticleDto, authorId: string): Promise<ArticleResponse> {
    this.logger.debug(`[updateArticle]: ${id}`);
    try {
      const author = await this.userRepository.findOne({ where: { id: authorId } });
      let article = await this.articleRepository.findOne({ where: { id: id }, relations: ['user', 'articleImage'] });
      // TODO : Check author of article and save log for another user edit
      if (!article) {
        throw new NotFoundException(`Article with ID ${id} not found`);
      }
      article = this.articleRepository.merge(article, { ...articleDto, user: author });
      const savedArticle = await this.articleRepository.save(article);

      const uploadedImages =
        articleDto.uploadedImageIds && articleDto.uploadedImageIds.length > 0
          ? await this.articleImageRepository.find({ where: { id: In(articleDto.uploadedImageIds) } })
          : [];

      uploadedImages.forEach((image) => {
        image.status = ImageStatus.UNUSED;
        image.article = savedArticle;
      });

      const usedImages =
        articleDto.usedImageIds && articleDto.usedImageIds.length > 0
          ? await this.articleImageRepository.find({ where: { id: In(articleDto.usedImageIds) } })
          : [];
      usedImages.forEach((image) => {
        image.status = ImageStatus.USED;
        image.article = savedArticle;
      });
      await this.articleImageRepository.save([...uploadedImages, ...usedImages]);

      return new ArticleResponse(savedArticle);
    } catch (error) {
      this.logger.error(`Failed to update Article with ID ${id}: ${error.message}`);
      throw new NotFoundException(`Failed to update Article with ID ${id}: ${error.message}`);
    }
  }

  async deleteArticle(id: number): Promise<void> {
    await this.articleRepository.delete(id);
  }

  // COMPANY SIDE
  async getManyArticlesForCompanySide(limit?: number): Promise<Article[]> {
    this.logger.debug('[getAllArticlesForCompanySide]');
    try {
      const queryOptions: FindManyOptions<Article> = {
        where: { status: ArticleStatus.PUBLISHED },
        order: { displayDate: 'DESC' },
      };

      if (limit) {
        queryOptions.take = limit;
      }

      return this.articleRepository.find(queryOptions);
    } catch (error) {
      this.logger.error(`Failed to get All Articles for Company: ${error.message}`);
      throw new NotFoundException(`Failed to get All Articles for Company: ${error.message}`);
    }
  }

  async getArticleByIdForCompanySide(id: number): Promise<ArticleResponse> {
    this.logger.debug(`[getArticleByIdForCompanySide]: ${id}`);
    try {
      const article = await this.articleRepository.findOne({ where: { id, status: ArticleStatus.PUBLISHED } });

      if (!article) {
        throw new NotFoundException(`Article with ID ${id} and status is ${ArticleStatus.PUBLISHED} not found`);
      }

      return new ArticleResponse(article);
    } catch (error) {
      this.logger.error(`Failed to get Article by ID ${id}: ${error.message}`);
      throw new NotFoundException(`Failed to get Article by ID ${id}: ${error.message}`);
    }
  }
}
