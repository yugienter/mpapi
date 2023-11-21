// Importing necessary modules and decorators
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { FileAttachments } from '@/app/models/file_attachments';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileAttachments) private fileRepository: Repository<FileAttachments>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createFile(fileData: {
    name: string;
    type: string;
    size: number;
    path: string;
    user: User;
  }): Promise<FileAttachments> {
    const uploadedFile = this.fileRepository.create(fileData);
    return this.fileRepository.save(uploadedFile);
  }

  //   // Function to retrieve file details from the database
  //   async getFileDetails(fileId: string): Promise<UploadedFile> {
  //     const file = await this.fileRepository.findOne(fileId);
  //     if (!file) {
  //       throw new Logger('File not found');
  //     }
  //     return file;
  //   }

  //   // Function to link a file with a company and save the relation in the database
  //   async linkFileToCompany(fileId: string, companyId: string): Promise<void> {
  //     return await this.entityManager.transaction(async (transactionalEntityManager) => {
  //       const file = await transactionalEntityManager.findOne(UploadedFile, fileId);
  //       const company = await transactionalEntityManager.findOne(Company, companyId);

  //       if (!file || !company) {
  //         throw new Logger('File or Company not found');
  //       }

  //       // Logic to associate file with company
  //       // This will depend on the relation defined in your models
  //       // For example, if it's a many-to-one relation from file to company
  //       file.company = company;
  //       await transactionalEntityManager.save(file);
  //     });
  //   }
}
