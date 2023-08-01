import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm'

import { UserProfile } from '@/app/models/user-profile'


@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ primary: true })
    id: string
  @Column({ nullable: false })
    email: string // firebase上にもあるが、一応こちらにも持たせる
  @Column({ default: false, select: false })
    is_admin: boolean
  @Column({ default: false, select: false })
    is_deleted: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////
  @OneToOne(() => UserProfile, (x) => x.user_id)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
    profile: UserProfile
}

export class ModifiedUser {
  id: string
  email: string
  is_admin: boolean
  is_deleted: boolean
  created_at: Date
  updated_at: Date
  profile: UserProfile
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
]

export const safeColumnsOfUserWallet = [
  'wallet_id',
  'name_sei',
  'name_mei',
  'kana_name_sei',
  'kana_name_mei',
  'gender_type',
  'birthday',
  'created_at',
  'updated_at',
]
