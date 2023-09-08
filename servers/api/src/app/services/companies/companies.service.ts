import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCompanyRequest } from '@/app/controllers/dto/company.dto';
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
  ) {}

  create(createCompany: CreateCompanyRequest): Promise<Company> {
    return this.companiesRepository.save(this.companiesRepository.create(createCompany));
  }

  manyToManyCreateCompanyUser(positionOfUser: string, company: Company, user: User) {
    const companiesUsers = new CompaniesUsers(positionOfUser, user, company);
    this.companiesUserRepository.save(companiesUsers);
  }

  async getCompaniesOfUser(userId: string) {
    return this.companiesRepository
      .createQueryBuilder('c')
      .select(['c.name', 'c.updated_at', 'c.id'])
      .innerJoin('c.companiesUsers', 'cu')
      .where('cu.user_id = :userId', { userId })
      .getMany();
  }

  // async getCompanyDetail(companyId: string, userId: string) {
  //   const query = this.companiesRepository
  //     .createQueryBuilder('c')
  //     .select(['c.*', 'cu.position_of_user'])
  //     .innerJoin('c.companiesUsers', 'cu')
  //     .where('cu.user_id = :userId', { userId })
  //     .andWhere('c.id = :companyId', { companyId });

  //   const sql = query.getSql();

  //   console.log('companyId:', companyId);
  //   console.log('userId:', userId);
  //   console.log('Generated SQL:', sql);

  //   return query.getOne();

  // }

  async getCompanyDetail(companyId: string, userId: string) {
    const userCompanyRelation = await this.companiesUserRepository.findOne({
      where: {
        user_id: userId,
        company_id: companyId,
      },
    });

    if (!userCompanyRelation) {
      return null;
    }

    return await this.companiesRepository.findOne({
      where: { id: companyId },
      relations: ['companiesUsers'],
    });
  }
}
