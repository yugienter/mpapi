import { RolesEnum, StatusEnum, User } from '@/app/models/user';

export class UserInfo {
  id: string;
  name: string;
  email: string;
  role: RolesEnum;
  status: StatusEnum;
  is_deleted: boolean;
  role_order: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.is_deleted = user.is_deleted;
    this.role_order = user.role_order;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
    this.deleted_at = user.deleted_at;
  }
}
