import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { RoleEnum } from 'src/roles/roles.enum';
import { Repository } from 'typeorm';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,
  ) {}

  async run() {
    const countCompany = await this.repository.count({
      where: {
        id: RoleEnum.company,
      },
    });

    if (!countCompany) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.company,
          name: 'Company',
        }),
      );
    }

    const countInvestor = await this.repository.count({
      where: {
        id: RoleEnum.investor,
      },
    });

    if (!countInvestor) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.investor,
          name: 'Investor',
        }),
      );
    }

    const countAdmin = await this.repository.count({
      where: {
        id: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.admin,
          name: 'Admin',
        }),
      );
    }
  }
}
