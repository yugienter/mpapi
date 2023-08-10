import { AfterLoad, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from '@/app/models/user';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryColumn({ name: 'user_id', primary: true, unique: true })
  @OneToOne(() => User, (x) => x.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user_id: string;

  @Column({ type: 'varchar', nullable: true })
  name_sei: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  name_mei: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  kana_name_sei: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  kana_name_mei: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  gender_type: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  birthday: string | null = null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', select: false })
  created_at: Date | null = null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', select: false })
  updated_at: Date | null = null;

  // ユーザーのフルネーム
  // AfterLoadで既存カラムを結合して作成
  full_name: string | null;

  @AfterLoad()
  setFullName() {
    !this.name_sei || !this.name_mei ? (this.full_name = null) : (this.full_name = this.name_sei + ' ' + this.name_mei);
  }

  ///////////////////////////////////
  //////////// RELATIONS ////////////
  ///////////////////////////////////
  @OneToOne(() => User, (x) => x.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User; // profileから逆に参照するケースはなさそうだが一応

  /* ユーザーの名前を返す
   *  nullだった場合は個人名が特定できるものを返却する。
   */
  getDispNameForEmailOrNotification(user: { email: string }): string {
    // fullnameが取れなければメールアドレスにしておく。
    return this.full_name ?? user.email;
  }

  /*
   *  性別を返す
   */
  getDispGenderFromGenderType(): string {
    if (!this.gender_type) {
      return '性別未設定';
    }
    if (this.gender_type == 'M') {
      return '男性';
    }
    if (this.gender_type == 'F') {
      return '女性';
    }
    // ここに来るのは明らかなバグ
    return '無効な性別';
  }
}
