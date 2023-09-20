import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from './company';
import { User } from './user';

@Entity('companies_users')
export class CompaniesUsers {
  constructor(position_of_user: string, user: User, company: Company) {
    this.position_of_user = position_of_user;
    this.user = user;
    this.company = company;
  }

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  position_of_user: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @ManyToOne(() => User, (user) => user.companiesUsers)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, (company) => company.companiesUsers)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
