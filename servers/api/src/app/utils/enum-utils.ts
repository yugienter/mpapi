import { SetMetadata } from '@nestjs/common';

export enum RolesEnum {
  admin = 'admin',
  company = 'company',
  investor = 'investor',
}

export const Roles = (...roles: RolesEnum[]) => SetMetadata('roles', roles);

export enum StatusEnum {
  'active' = 'active',
  'inActive' = 'inActive',
}

export enum TypeOfBusinessEnum {
  MANUFACTURE = 'manufacture',
  DISTRIBUTION = 'distribution',
}
