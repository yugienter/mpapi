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

  @ManyToOne(() => User, (user) => user.articleImages)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToOne(() => Article, (article) => article.articleImages)
  @JoinColumn({ name: 'article_id' })
  article?: Article;
}
