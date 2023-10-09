import { SetMetadata } from '@nestjs/common';

import { RolesEnum } from '@/app/models/user';

export const Roles = (...roles: RolesEnum[]) => SetMetadata('roles', roles);
