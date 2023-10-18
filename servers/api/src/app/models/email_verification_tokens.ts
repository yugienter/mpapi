import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/app/models/user';

export enum TokenActionEnum {
  VERIFY_EMAIL = 'verify_email',
  RESET_PASSWORD = 'reset_password',
}

@Entity({ name: 'email_verification_tokens' })
@Index(['token', 'type', 'expires_at']) // Adding index for optimized queries
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'enum', enum: TokenActionEnum, default: TokenActionEnum.VERIFY_EMAIL })
  type: TokenActionEnum;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.emailVerificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
