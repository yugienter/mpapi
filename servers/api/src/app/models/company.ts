import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';
import { User } from '@/app/models/user';

export enum StatusOfInformation {
  DRAFT = 'DRAFT',
  DRAFT_FROM_ADMIN = 'DRAFT_FROM_ADMIN',
  REQUEST = 'REQUEST',
  SUBMITTED = 'SUBMITTED',
  CREATE_FROM_ADMIN = 'CREATE_FROM_ADMIN',
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @Column({ type: 'varchar', nullable: true })
  contact_person_name: string;

  @Column({ type: 'varchar', nullable: true })
  contact_person_email: string;

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @OneToMany(() => CompanyInformation, (companyInformation) => companyInformation.company)
  company_information: CompanyInformation[];

  @ManyToOne(() => User, (user) => user.companies)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_admin' })
  admin: User;
}
