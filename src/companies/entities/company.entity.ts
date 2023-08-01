import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Expose } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
// import { ValidateIf } from 'class-validator';
// import { CountryAreaEnum } from '../company.enum';

@Entity()
export class Company extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  @Expose({ name: 'describe' })
  description_1: string;

  @Column({ type: 'text' })
  @Expose({ name: 'introduction' })
  description_2: string;

  @Column()
  country: string;

  // @ValidateIf((object) => object.areaOther)
  @Column()
  area: string;

  @Column()
  areaOther: boolean;

  @Column()
  typeOfBusiness: string;

  @Column()
  commodity: string;

  @Column()
  willingTo: boolean;

  @Column()
  dateOfEstablishment: string;

  /**
   * store currency amounts with precision of 10 and upto 2 decimal places.
   */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  annualRevenue: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  annualProfit: number;

  @Column({ type: Number, nullable: true })
  numberOfEmployees: number;

  @Column({ type: Number, nullable: true })
  sellOfShares: number;

  @Column({ type: Number, nullable: true })
  expectedPriceOfShares: number;

  @Column({ type: Number, nullable: true })
  expectedPriceOfSharesPercent: number;

  @Column({ type: Number, nullable: true })
  issuanceRaiseMoney: number;

  @Column({ type: Number, nullable: true })
  issuancePriceOfShares: number;

  @Column({ type: Number, nullable: true })
  issuancePriceOfSharesPercent: number;

  @Column('boolean', { default: false })
  businessCollaboration: boolean = false;

  // @Column({ type: String, nullable: true })
  @Column({ type: 'text', nullable: true })
  collaborationDetail: string | null;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
