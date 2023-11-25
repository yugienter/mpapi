import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Company, StatusOfInformation } from '@/app/models/company';
import { CompanyFinancialData } from '@/app/models/company_financial_data';
import { FileAttachments } from '@/app/models/file_attachments';

/*************************************************************************************
 * CAUTION: This enum is the same from CLIENT SIDE.                                  *
 * IF EDIT AND COMMIT THIS ENUM - PLEASE CLONE AND UPDATE THAT TO API WITH THE SAME  *
 *************************************************************************************/
export enum TypeOfBusinessEnum {
  MANUFACTURING = 'Manufacturing',
  DISTRIBUTION = 'Distribution',
  RETAIL = 'Retail',
  RESTAURANT = 'Restaurant',
  MEDICAL_SERVICE_AND_HEALTH_CARE = 'Medical Service, health care',
  CONSTRUCTION = 'Construction',
  EDUCATION = 'Education',
  REAL_PROPERTY = 'Real property',
  E_COMMERCE = 'E-commerce',
  IT_SOFTWARE_ENGINEERING = 'IT, software, engineering',
  TRAVE_SIGHTSEEING = 'Trave, sightseeing',
  ADVERTISEMENT_ENTERTAINMENT_PUBLISHING = 'Advertisement, entertainment, publishing',
  ENVIRONMENT_ESG_SOLUTION = 'Environment, ESG solution',
  ENERGY_MINERAL_RESOURCES = 'Energy, mineral resources',
  LOGISTICS = 'logistics',
  FINANCE_AND_FINTECH = 'Finance and fintech',
  OTHER_SERVICE = 'Other service',
  OTHER_BUSINESS = 'Other business',
}

@Entity('company_information')
export class CompanyInformation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { nullable: true })
  general_shareholder_structure: string;

  @Column('text', { nullable: true })
  general_management_structure: string;

  @Column()
  general_year_of_establishment: number;

  @Column({ length: 255 })
  general_headquarter: string;

  @Column({ length: 50 })
  general_business_type: TypeOfBusinessEnum;

  @Column({ length: 50 })
  general_business_location_country: string;

  @Column({ length: 50 })
  general_business_location_area: string;

  @Column()
  general_number_of_employees: number;

  @Column('text', { nullable: true })
  business_overview: string;

  @Column('text', { nullable: true })
  business_main_products_services: string;

  @Column('text', { nullable: true })
  business_major_clients: string;

  @Column('text', { nullable: true })
  business_major_suppliers: string;

  @Column('text', { nullable: true })
  business_future_growth_projection: string;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value) => value,
      from: (value) => parseInt(value, 10),
    },
  })
  financial_current_valuation: number;

  @Column()
  transaction_sell_shares_percentage: number;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value) => value,
      from: (value) => parseInt(value, 10),
    },
  })
  transaction_sell_shares_amount: number;

  @Column()
  transaction_issue_shares_percentage: number;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value) => value,
      from: (value) => parseInt(value, 10),
    },
  })
  transaction_issue_shares_amount: number;

  @Column('text', { nullable: true })
  transaction_other_details: string;

  @Column('text', { nullable: true })
  reason_deal_reason: string;

  @Column('text', { nullable: true })
  reason_deal_timeline: string;

  @Column({ length: 50 })
  status: StatusOfInformation;

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @ManyToOne(() => Company, (company) => company.company_information)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => CompanyFinancialData, (data) => data.company_information)
  financial_data: CompanyFinancialData[];

  @OneToMany(() => FileAttachments, (file) => file.company_information)
  files: FileAttachments[];
}
