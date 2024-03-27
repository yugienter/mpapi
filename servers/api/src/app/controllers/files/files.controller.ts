/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, Controller, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import _ from 'lodash';

import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { S3Provider } from '@/app/providers/s3.provider';
import { FileService } from '@/app/services/files/files.service';
import { UsersService } from '@/app/services/users/users.service';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

interface FileStorageStrategy {
  storeFile(file: any, user: ModifiedUser): Promise<any>;
}

abstract class BaseFileStorageStrategy implements FileStorageStrategy {
  constructor(
    protected readonly filesService: FileService,
    protected readonly s3Provider: S3Provider,
    protected readonly folder: string,
  ) {}

  async storeFile(file: any, user: ModifiedUser) {
    const contentType = file.mimetype;
    const s3Key = await this.s3Provider.uploadFile(
      file,
      contentType,
      user.role,
      this.folder === 'company' ? 'infoDetail' : this.folder,
    );

    const fileData = {
      name: file.filename,
      type: file.mimetype,
      size: file.size,
      path: s3Key,
      user: user as User,
    };

    if (this.folder === 'company') {
      return this.filesService.createAttachmentFileOfCompany(fileData);
    }

    if (this.folder === 'article') {
      return this.filesService.createImageForArticle(fileData);
    }
  }
}

class ArticleFileStorageStrategy extends BaseFileStorageStrategy {
  constructor(filesService: FileService, s3Provider: S3Provider) {
    super(filesService, s3Provider, 'articles');
  }

  async storeFile(file: any, user: ModifiedUser) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only images are allowed for articles');
    }

    return super.storeFile(file, user);
  }
}

class CompanyFileStorageStrategy extends BaseFileStorageStrategy {
  constructor(filesService: FileService, s3Provider: S3Provider) {
    super(filesService, s3Provider, 'infoDetail');
  }

  async storeFile(file: any, user: ModifiedUser) {
    return super.storeFile(file, user);
  }
}

@ApiTags('files')
@MpplatformApiDefault()
@Authorized()
@Controller('files')
@UseGuards(RolesGuard)
export class FilesController {
  private readonly strategies: { [key: string]: FileStorageStrategy };

  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FileService,
    private readonly s3Provider: S3Provider,
  ) {
    this.strategies = {
      article: new ArticleFileStorageStrategy(this.filesService, this.s3Provider),
      company: new CompanyFileStorageStrategy(this.filesService, this.s3Provider),
    };
  }

  @ApiOperation({ summary: 'Upload new files.' })
  @Post('upload/:source')
  @Roles(RolesEnum.company, RolesEnum.admin)
  async uploadMultipleFiles(@Req() request: FastifyRequest, @Param('source') source: string) {
    if (!request.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const uid: string = request.raw.user.uid;
    const user = await this.usersService.getUser(uid);

    this.checkPermissions(user, source);

    const files = await request.saveRequestFiles();
    const uploadResults = await this.uploadAndSaveFiles(files, user, source);

    return { files: uploadResults };
  }

  private checkPermissions(user: ModifiedUser, source: string) {
    if (source === 'article' && user.role !== 'admin') {
      throw new UnauthorizedException();
    }
  }

  private async uploadAndSaveFiles(files: any[], user: ModifiedUser, source: string) {
    return Promise.all(files.map(async (file) => this.uploadAndSaveSingleFile(file, user, source)));
  }

  private async uploadAndSaveSingleFile(file: any, user: ModifiedUser, source: string) {
    const strategy = this.strategies[source];
    if (!strategy) {
      throw new BadRequestException('Invalid source');
    }

    const savedFile = await strategy.storeFile(file, user);

    return { originalName: file.filename, id: savedFile.id, path: savedFile.path, source: source };
  }
}
