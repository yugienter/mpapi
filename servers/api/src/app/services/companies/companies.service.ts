import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { CreateCompanyRequest, UpdateCompanyInfoDto } from '@/app/controllers/dto/company.dto';
import { CompaniesUsers } from '@/app/models/companies-users';
import { Company } from '@/app/models/company';
import { UploadedFile } from '@/app/models/uploaded-file';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';
import _ from 'lodash';

@Service()
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company) private companiesRepository: Repository<Company>,
    @InjectRepository(UploadedFile) private fileRepository: Repository<UploadedFile>,
    @InjectRepository(CompaniesUsers) private companiesUserRepository: Repository<CompaniesUsers>,
    @InjectEntityManager() private readonly _entityManager: EntityManager,
  ) {}

  private async findAndValidateFiles(fileIds: number[], entityManager?: EntityManager): Promise<UploadedFile[]> {
    return Promise.all(
      fileIds.map(async (fileId) => {
        let file: UploadedFile;

        if (entityManager) {
          file = await entityManager.findOne(UploadedFile, { where: { id: fileId } });
        } else {
          file = await this.fileRepository.findOne({ where: { id: fileId } });
        }

        if (!file) {
          throw new NotFoundException(`File with ID ${fileId} not found`);
        }

        if (file.company) {
          throw new Error(`File with ID ${fileId} is already assigned to another company`);
        }

        return file;
      }),
    );
  }

  async create(createCompany: CreateCompanyRequest): Promise<Company> {
    const company = new Company();

    if (createCompany.files && createCompany.files.length > 0) {
      company.files = await this.findAndValidateFiles(createCompany.files);
    }
    return this.companiesRepository.save(this.companiesRepository.create(company));
  }

  manyToManyCreateCompanyUser(positionOfUser: string, company: Company, user: User) {
    const companiesUsers = new CompaniesUsers(positionOfUser, user, company);
    this.companiesUserRepository.save(companiesUsers);
  }

  async createCompanyAndLinkUser(
    createCompanyDto: CreateCompanyRequest,
    userId: string,
  ): Promise<{ company: Company; user: User }> {
    return await this._entityManager.transaction(async (transactionalEntityManager) => {
      const company = new Company();
      Object.assign(company, createCompanyDto);

      if (createCompanyDto.files && createCompanyDto.files.length > 0) {
        company.files = await this.findAndValidateFiles(createCompanyDto.files, transactionalEntityManager);
      }

      const savedCompany = await transactionalEntityManager.save(Company, company);

      const user = await transactionalEntityManager.findOne(User, { where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      const positionOfUser = createCompanyDto.position_of_user;
      const companiesUsers = new CompaniesUsers(positionOfUser, user, savedCompany);
      await transactionalEntityManager.save(CompaniesUsers, companiesUsers);

      return { company: savedCompany, user: user };
    });
  }

  async getCompaniesOfUser(userId: string) {
    return this.companiesRepository
      .createQueryBuilder('c')
      .select(['c.name', 'c.updated_at', 'c.id'])
      .innerJoin('c.companiesUsers', 'cu')
      .where('cu.user_id = :userId', { userId })
      .getMany();
  }

  async getCompanyDetail(companyId: string, userId: string) {
    const userCompanyRelation = await this.companiesUserRepository.findOne({
      where: {
        user: { id: userId },
        company: { id: companyId },
      },
    });

    if (!userCompanyRelation) {
      throw new NotFoundException('User is not associated with the requested company');
    }

    const company = await this.companiesRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.companiesUsers', 'companiesUsers')
      .leftJoinAndSelect('companiesUsers.user', 'user')
      .leftJoinAndSelect('company.files', 'file', 'file.is_deleted = false')
      .where('company.id = :companyId', { companyId })
      .getOne();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const result = {
      ...company,
      position_of_user: userCompanyRelation.position_of_user,
      files: _.map(company.files, (file) => ({ id: file.id, path: file.path, name: file.name })),
    };

    return result;
  }

  // async getFirstCompanyFullDetailsOfUser(userId: string): Promise<{ company: Company; positionOfUser: string } | null> {
  //   const result = await this.companiesRepository
  //     .createQueryBuilder('c')
  //     .innerJoinAndSelect('c.companiesUsers', 'cu')
  //     .where('cu.user_id = :userId', { userId })
  //     .getOne();

  //   if (result) {
  //     return {
  //       company: { ...result },
  //       positionOfUser: result.companiesUsers[0].position_of_user,
  //     };
  //   }
  //   return null;
  // }

  async updateCompany(companyId: string, updateCompanyDto: UpdateCompanyInfoDto): Promise<Company> {
    return await this.companiesRepository.manager.transaction(async (manager) => {
      const company = await manager
        .createQueryBuilder(Company, 'company')
        .leftJoinAndSelect('company.files', 'file')
        .where('company.id = :companyId', { companyId })
        .getOne();

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, ...updateDtoWithoutFiles } = updateCompanyDto;
      Object.assign(company, updateDtoWithoutFiles);

      /** Start Update company files */
      const existingActiveFileIds = company.files.filter((file) => !file.is_deleted).map((file) => file.id);

      const newFileIds = updateCompanyDto.files || [];
      const filesToDelete = existingActiveFileIds.filter((id) => !newFileIds.includes(id));
      const filesToAdd = newFileIds.filter((id) => !existingActiveFileIds.includes(id));

      if (filesToDelete.length > 0) {
        await manager
          .createQueryBuilder()
          .update(UploadedFile)
          .set({ is_deleted: true, deleted_at: new Date() })
          .where('id IN (:...ids)', { ids: filesToDelete })
          .execute();
      }

      if (filesToAdd.length > 0) {
        const newFiles = await this.findAndValidateFiles(filesToAdd, manager);
        company.files = [...company.files, ...newFiles];
      }

      /** End Update company files */
      await manager.save(Company, company);

      // Update position_of_user in companies_users table
      const companyUserRelation = await manager.findOne(CompaniesUsers, {
        where: { company: { id: companyId } },
      });

      if (companyUserRelation) {
        companyUserRelation.position_of_user = updateCompanyDto.position_of_user;
        await manager.save(CompaniesUsers, companyUserRelation);
      }

      company.files = company.files.filter(
        (file) => (!file.is_deleted || newFileIds.includes(file.id)) && !filesToDelete.includes(file.id),
      );

      return company;
    });
  }
}
