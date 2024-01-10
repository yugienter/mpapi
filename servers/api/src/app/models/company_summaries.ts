import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanyInformation, TypeOfBusinessEnum } from '@/app/models/company_information';

export enum SummaryStatus {
  DRAFT = 'DRAFT',
  DRAFT_FROM_ADMIN = 'DRAFT_FROM_ADMIN',
  REQUEST = 'REQUEST',
  SUBMITTED = 'SUBMITTED',
  POSTED = 'POSTED',
}

@Entity('company_summaries')
export class CompanySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  country: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  type_of_business: TypeOfBusinessEnum;

  @Column()
  status: SummaryStatus;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'int', nullable: true })
  version: number;

  @Column({ type: 'int', nullable: true })
  original_version_id: number;

  @Column({ type: 'json', nullable: true })
  changes_json: any;

  @Column({ type: 'int', nullable: true })
  card_order: number | null;

  @CreateDateColumn({ nullable: true })
  added_to_master_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => CompanyInformation)
  @JoinColumn({ name: 'company_information_id' })
  companyInformation: CompanyInformation;
}
