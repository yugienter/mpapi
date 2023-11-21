import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyInformation } from '@/app/models/company_information';

@Entity('company_financial_data')
export class CompanyFinancialData {
  @PrimaryGeneratedColumn()
  id: number;

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

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @ManyToOne(() => CompanyInformation, (companyInformation) => companyInformation.financial_data)
  @JoinColumn({ name: 'company_information_id' })
  company_information: CompanyInformation;
}
