import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';
import { User } from '@/app/models/user';

// import { CompaniesUsers } from '@/app/models/companies-users';
// import { UploadedFile } from '@/app/models/uploaded-file';

export enum StatusOfInformation {
  DRAFT = 'DRAFT',
  DRAFT_FROM_ADMIN = 'DRAFT_FROM_ADMIN',
  REQUEST = 'REQUEST',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  position: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @ManyToOne(() => User, (user) => user.companies)
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToMany(() => CompanyInformation, (companyInformation) => companyInformation.company)
  company_information: CompanyInformation[];
}
