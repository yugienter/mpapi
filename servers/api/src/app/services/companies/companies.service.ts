import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCompanyDto } from '@/app/controllers/dto/company.dto';
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

  create(createCompany: CreateCompanyDto): Promise<Company> {
    return this.companiesRepository.save(this.companiesRepository.create(createCompany));
  }

  manyToManyCreateCompanyUser(positionOfUser: string, company: Company, user: User) {
    const companiesUsers = new CompaniesUsers(positionOfUser, user, company);
    this.companiesUserRepository.save(companiesUsers);
  }
}
