import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  // PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserProfile } from '@/app/models/user-profile';

import { CompaniesUsers } from './companies-users';

export enum StatusEnum {
  'active' = 'active',
  'inActive' = 'inActive',
}

export enum RolesEnum {
  admin = 'admin',
  company = 'company',
  investor = 'investor',
}

@Entity({ name: 'users' })
@Index(['email', 'role'], { unique: true })
export class User {
  // @PrimaryColumn({ primary: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  email: string; // firebase上にもあるが、一応こちらにも持たせる

  @Column({ nullable: false, default: RolesEnum.company })
  role: RolesEnum;

  @Column({ nullable: false, default: StatusEnum.inActive })
  status: StatusEnum;

  @Column({ default: false, select: false })
  is_deleted: boolean;

  // @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  // created_at: Date;

  // @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  // updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////

  @OneToOne(() => UserProfile, (x) => x.user_id)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  profile: UserProfile;

  @OneToMany(() => CompaniesUsers, (companiesUsers) => companiesUsers.user)
  public companiesUsers: CompaniesUsers[];
}

export class ModifiedUser {
  id: string;
  name: string;
  email: string;
  role: RolesEnum;
  status: StatusEnum;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  profile: UserProfile;
}

export const safeColumnsOfUserProfile = [
  'user_id',
  'name_sei',
  'name_mei',
  'kana_name_sei',
  'kana_name_mei',
  'gender_type',
  'birthday',
  'created_at',
  'updated_at',
];


