import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';

@Entity('admin_company_information_notes')
export class AdminCompanyInformationNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => CompanyInformation, (companyInformation) => companyInformation.adminNote)
  @JoinColumn({ name: 'company_information_id' })
  companyInformation: CompanyInformation;
}
