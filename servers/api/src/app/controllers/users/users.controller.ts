import { Controller, Get, Logger, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import _ from 'lodash';

import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { AuthProvider } from '@/app/providers/auth.provider';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('users')
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
  async getMe(@Req() request) {
    const requesterId = request.raw.uid;
    const result = await this.usersService.getUser(requesterId);

    return {
      user: result.user,
    };
  }
}
