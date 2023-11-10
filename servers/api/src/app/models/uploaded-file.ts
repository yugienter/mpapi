import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from '@/app/models/company';
import { User } from '@/app/models/user';

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => User, (user) => user.files)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, (company) => company.files)
  @JoinColumn({ name: 'company_id' })
  company?: Company;
}
