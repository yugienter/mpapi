import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Article } from '@/app/models/articles';
import { User } from '@/app/models/user';

export enum ImageStatus {
  UNUSED = 'UNUSED',
  USED = 'USED',
}

@Entity('article_images')
export class ArticleImage {
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

  @Column({
    type: 'enum',
    enum: ImageStatus,
    default: ImageStatus.UNUSED,
  })
  status: ImageStatus;

  @ManyToOne(() => User, (user) => user.articleImages)
  @JoinColumn({ name: 'created_by' })
  user: User;

  @ManyToOne(() => Article, (article) => article.articleImage)
  @JoinColumn({ name: 'article_id' })
  article?: Article;
}
