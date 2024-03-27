// Importing necessary modules and decorators
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { ArticleImage } from '@/app/models/article_images';
import { FileAttachments } from '@/app/models/file_attachments';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileAttachments) private fileAttachmentRepository: Repository<FileAttachments>,
    @InjectRepository(ArticleImage) private articleImageRepository: Repository<ArticleImage>,
    @InjectEntityManager() private readonly entityManager: EntityManager, // eslint-disable-next-line no-empty-function
  ) {}

  private async _createFile<T>(
    repository: Repository<T>,
    fileData: {
      name: string;
      type: string;
      size: number;
      path: string;
      user: User;
    },
  ): Promise<T> {
    const uploadedFile = repository.create(fileData as DeepPartial<T>);
    return repository.save(uploadedFile);
  }

  async createAttachmentFileOfCompany(fileData: {
    name: string;
    type: string;
    size: number;
    path: string;
    user: User;
  }): Promise<FileAttachments> {
    return this._createFile(this.fileAttachmentRepository, fileData);
  }

  async createImageForArticle(fileData: {
    name: string;
    type: string;
    size: number;
    path: string;
    user: User;
  }): Promise<ArticleImage> {
    return this._createFile(this.articleImageRepository, fileData);
  }
}
