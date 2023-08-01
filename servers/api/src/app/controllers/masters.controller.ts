import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'

import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { MastersService } from '@/app/services/masters.service'
import { UsersService } from '@/app/services/users/users.service'
import { Coded } from '@/app/utils/coded'
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators'
import { ValidationUtil } from '@/app/utils/validation.util'

/**
 * ほぼデータ上変化がなく、処理が簡単なものについては一旦全部ここに放り込む。
 * e.g. tags, equipments, categories, etc.
 */
@MpplatformApiDefault()
@Authorized()
@Controller('')
export class MastersController implements Coded {
  private readonly logger = new Logger(MastersController.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly mastersService: MastersService
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CMS'
  }

  static ERROR_CODES = {
    /** 権限エラー */
    INVALID_ROLE: ErrorInfo.getBuilder('IR', 'invalid_role_for_this_user'),
  }

  get errorCodes() {
    return MastersController.ERROR_CODES
  }
}
