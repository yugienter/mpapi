import {
  Body,
  Controller,
  Get,
  Logger,
  Put,
  Req,
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import _ from 'lodash'

import {
  EmailRequest,
  PasswordChangingRequest,
  UserUpdateRequest
} from '@/app/controllers/dto/user.dto'
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { AuthProvider } from '@/app/providers/auth.provider'
import { UsersService } from '@/app/services/users/users.service'
import { Coded } from '@/app/utils/coded'
import { Authorized, MpplatformApiDefault, MultipartDefault } from '@/app/utils/decorators'
import { ValidationUtil } from '@/app/utils/validation.util'

@MpplatformApiDefault()
@Authorized()
@Controller('users')
export class UsersController implements Coded {
  private readonly logger = new Logger(UsersController.name)

  constructor(
    private readonly authProvider: AuthProvider,
    private readonly usersService: UsersService,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CUS'
  }

  static ERROR_CODES = {
    /** 権限エラー */
    INVALID_ROLE: ErrorInfo.getBuilder('IR', 'invalid_role_for_this_user'),
  }

  get errorCodes() {
    return UsersController.ERROR_CODES
  }

  @ApiOperation({
    description: '自身の詳細情報を取得する。<br />'
      + 'このAPIを叩いて、情報を取得できない場合(401の時)はログインしていないと判別できる。',
    tags: ['user'],
  })
  @Get('me')
  async getMe(@Req() request) {
    const requesterId = request.raw.uid
    const result = await this.usersService.getUser(requesterId)

    return {
      user: result.user,
    }
  }

  @ApiOperation({
    description: '自分のプロフィール情報を更新する。',
    tags: ['user'],
  })
  @Put('me')
  async updateOwnUser(@Req() request, @Body() dto: UserUpdateRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        name_sei: { type: ['string', 'null'], maxLength: 40, },
        name_mei: { type: ['string', 'null'], maxLength: 40, },
        kana_name_sei: { type: ['string', 'null'], maxLength: 40, },
        kana_name_mei: { type: ['string', 'null'], maxLength: 40, },
        birthday: { format: 'date', type: ['string', 'null'], },
        gender: { enum: ['M', 'F', null], },
      },
      required: [],
      additionalProperties: true
    })
    const requesterId = request.raw.uid
    const result = await this.usersService.updateUser(requesterId, dto)
    return {
      user: result.user,
    }
  }

  @ApiOperation({
    description: 'メールアドレスを変更する',
    tags: ['user'],
  })
  @Put('me/email')
  async updateEmail(@Req() request, @Body() dto: EmailRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        email: { type: 'string', maxLength: 200,  format: 'email' },
      },
      required: ['email'],
      additionalProperties: true
    })
    const requesterId = request.raw.uid
    const result = await this.usersService.verifyToUpdateEmail(requesterId, dto)
    return {
      user: result.user,
    }
  }

  @ApiOperation({
    description: 'パスワードを変更する',
    tags: ['user'],
  })
  @Put('me/password')
  async updatePassword(@Req() request, @Body() dto: PasswordChangingRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        current_password: { type: 'string', minLength: 8, maxLength: 64, },
        password: { type: 'string', minLength: 8, maxLength: 64 },
        password_confirmation: { const: { $data: '1/password' } },
      },
      required: ['current_password', 'password', 'password_confirmation'],
      additionalProperties: true
    })
    const requesterId = request.raw.uid
    const result = await this.usersService.updatePassword(requesterId, dto)
    return {
      user: result.user,
    }
  }
}
