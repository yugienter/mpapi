import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { CreateCompanyRequest, UpdateCompanyInfoDto } from '@/app/controllers/dto/company.dto';
import { CompaniesUsers } from '@/app/models/companies-users';
import { Company } from '@/app/models/company';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company) private companiesRepository: Repository<Company>,
    @InjectRepository(CompaniesUsers) private companiesUserRepository: Repository<CompaniesUsers>,
    @InjectEntityManager() private readonly _entityManager: EntityManager,
  ) {}

  create(createCompany: CreateCompanyRequest): Promise<Company> {
    return this.companiesRepository.save(this.companiesRepository.create(createCompany));
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
      return null;
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
      relations: ['companiesUsers', 'companiesUsers.user'],
    });

    if (!company) {
      return null;
    }

    const result = {
      ...company,
      position_of_user: userCompanyRelation.position_of_user,
    };

    return result;
  }

  async getFirstCompanyFullDetailsOfUser(userId: string): Promise<{ company: Company; positionOfUser: string } | null> {
    const result = await this.companiesRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.companiesUsers', 'cu')
      .where('cu.user_id = :userId', { userId })
      .getOne();

    if (result) {
      return {
        company: { ...result },
        positionOfUser: result.companiesUsers[0].position_of_user,
      };
    }
    return null;
  }

  async updateCompany(companyId: string, updateCompanyDto: UpdateCompanyInfoDto): Promise<Company> {
    return await this.companiesRepository.manager.transaction(async (manager) => {
      const company = await manager.findOne(Company, { where: { id: companyId } });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Update company fields
      Object.assign(company, updateCompanyDto);
      await manager.save(Company, company);

      // Update position_of_user in companies_users table
      const companyUserRelation = await manager.findOne(CompaniesUsers, {
        where: { company: { id: companyId } },
      });

      if (companyUserRelation) {
        companyUserRelation.position_of_user = updateCompanyDto.position_of_user;
        await manager.save(CompaniesUsers, companyUserRelation);
      }

      return company;
    });
  }
}
