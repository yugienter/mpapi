import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import _ from 'lodash';

import { Roles } from '@/app/decorators/roles.decorator';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { RolesGuard } from '@/app/guards/roles.guard';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { AuthProvider } from '@/app/providers/auth.provider';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController implements Coded {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly authProvider: AuthProvider, private readonly usersService: UsersService) {
    // nothing to do
  }

  get code(): string {
    return 'CUS';
  }

  static ERROR_CODES = {
    /** 権限エラー */
    INVALID_ROLE: ErrorInfo.getBuilder('IR', 'invalid_role_for_this_user'),
  };

  get errorCodes() {
    return UsersController.ERROR_CODES;
  }

  @ApiOperation({
    description: 'Get info of user by them self',
    tags: ['user'],
  })
  @Get('me')
  @Roles(RolesEnum.company, RolesEnum.admin, RolesEnum.investor)
  async getMe(@Req() request): Promise<{ user: ModifiedUser }> {
    const requesterId: string = request.raw.user.uid;
    const role: RolesEnum = request.raw.user.roles[0];
    const result = await this.usersService.getUser(requesterId);

    this.usersService.verifyUserRole(result as User, role);

    return { user: result };
  }
}
