import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToOne(() => CompanyInformation)
  @JoinColumn({ name: 'company_information_id' })
  companyInformation: CompanyInformation;
}
