import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user';
import { CompaniesUsers } from './companies-users';


export enum TypeOfBusinessEnum {
  MANUFACTURE = 'manufacture',
  DISTRIBUTION = 'distribution',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description_1: string;

  @Column()
  description_2: string;

  @Column()
  country: string;

  // @ValidateIf((object) => object.areaOther)
  @Column()
  area: string;

  @Column()
  area_other: boolean;

  @Column()
  type_of_business: TypeOfBusinessEnum;

  @Column()
  commodity: string;

  @Column()
  willing_to: boolean;

  @Column()
  date_of_establishment: string;

  /**
   * store currency amounts with precision of 10 and upto 2 decimal places.
   */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  annual_revenue: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  annual_profit: number;

  @Column({ type: Number, nullable: true })
  number_of_employees: number;

  @Column({ type: Number, nullable: true })
  sell_of_shares: number;

  @Column({ type: Number, nullable: true })
  expected_price_of_shares: number;

  @Column({ type: Number, nullable: true })
  expected_price_of_shares_percent: number;

  @Column({ type: Number, nullable: true })
  issuance_raise_money: number;

  @Column({ type: Number, nullable: true })
  issuance_price_of_shares: number;

  @Column({ type: Number, nullable: true })
  issuance_price_of_shares_percent: number;

  @Column('boolean', { default: false })
  business_collaboration = false;

  @Column({ type: String, nullable: true })
  collaboration_detail: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @OneToMany(() => CompaniesUsers, (companiesUsers) => companiesUsers.company)
  public companiesUsers: CompaniesUsers[];
}
