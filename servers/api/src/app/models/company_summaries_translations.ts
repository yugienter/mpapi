import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToOne(() => CompanySummary)
  @JoinColumn({ name: 'company_summary_id' })
  companySummary: CompanySummary;
}
