import { ArticleImage } from '@/app/models/article_images';
import { Article, ArticleStatus } from '@/app/models/articles';
import { User } from '@/app/models/user';

export class ArticleResponse {
  id: number;
  title: string;
  content: string;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  articleImage: ArticleImage[];

  constructor(article: Article) {
    this.id = article.id;
    this.title = article.title;
    this.content = article.content;
    this.status = article.status;
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
    this.user = article.user;
    this.articleImage = article.articleImage;
  }
}
