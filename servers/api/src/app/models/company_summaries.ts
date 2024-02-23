import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';

export enum SummaryStatus {
  DRAFT = 'DRAFT',
  DRAFT_FROM_ADMIN = 'DRAFT_FROM_ADMIN',
  REQUEST = 'REQUEST',
  SUBMITTED = 'SUBMITTED',
  POSTED = 'POSTED',
}

export enum YearsEnum {
  UNDER_1 = 'under 1',
  ONE_TO_FIVE = '1-5',
  FIVE_TO_TEN = '5-10',
  TEN_TO_TWENTY_FIVE = '10-25',
  TWENTY_FIVE_TO_FIFTY = '25-50',
  OVER_FIFTY = 'over 50',
}

export enum NumberOfEmployeesEnum {
  ZERO_TO_TWENTY_FIVE = '0-25',
  TWENTY_FIVE_TO_FIFTY = '25-50',
  FIFTY_TO_ONE_HUNDRED = '50-100',
  ONE_HUNDRED_TO_TWO_FIFTY = '100-250',
  TWO_FIFTY_TO_FIVE_HUNDRED = '250-500',
  OVER_FIVE_HUNDRED = '500+',
}

export enum AnnualRevenueEnum {
  NEGATIVE = 'negative',
  ZERO_TO_FIVE_M_USD = '0-5',
  FIVE_TO_TEN_M_USD = '5-10',
  TEN_TO_TWENTY_FIVE_M_USD = '10-25',
  TWENTY_FIVE_TO_FIFTY_M_USD = '25-50',
  FIFTY_TO_ONE_HUNDRED_M_USD = '50-100',
  ONE_HUNDRED_TO_TWO_FIFTY_M_USD = '100-250',
  TWO_FIFTY_TO_FIVE_HUNDRED_M_USD = '205-500',
  OVER_FIVE_HUNDRED_M_USD = '500+',
}

@Entity('company_summaries')
export class CompanySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  country: string;

  @Column({ length: 50 })
  area: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  type_of_business: string;

  @Column()
  years: string;

  @Column()
  number_of_employees: string;

  @Column()
  annual_revenue: string;

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
