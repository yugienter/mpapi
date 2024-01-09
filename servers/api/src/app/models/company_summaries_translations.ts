import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompanySummary } from '@/app/models/company_summaries';
import { LanguageEnum } from '@/app/models/enum';

@Entity('company_summaries_translations')
export class CompanySummaryTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  language: LanguageEnum;

  @Column()
  title_translated: string;

  @Column('text')
  content_translated: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => CompanySummary)
  @JoinColumn({ name: 'company_summary_id' })
  companySummary: CompanySummary;
}
