import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';

@Entity('company_financial_data')
export class CompanyFinancialData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CompanyInformation, (companyInformation) => companyInformation.financial_data)
  company_information: CompanyInformation;

  @Column()
  year: number;

  @Column('bigint', { nullable: true })
  sales: number;

  @Column('bigint', { nullable: true })
  profit: number;

  @Column('bigint', { nullable: true })
  EBITDA: number;

  @Column('bigint', { nullable: true })
  net_asset: number;

  @Column('bigint', { nullable: true })
  net_debt: number;
}
