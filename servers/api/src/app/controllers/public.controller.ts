import { Controller, Get, Logger, Query, } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import moment from 'moment'

import { ConfigProvider } from '@/app/providers/config.provider'
import { ApplicationsService } from '@/app/services/applications.service'
import { Coded } from '@/app/utils/coded'
import { MpplatformApiDefault } from '@/app/utils/decorators'
import { ValidationUtil } from '@/app/utils/validation.util'

/**
 */
@MpplatformApiDefault()
@Controller('')
export class PublicController implements Coded {
  private readonly logger = new Logger(PublicController.name)

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly applicationsService: ApplicationsService,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CABS'
  }

  @ApiOperation({
    description: 'APIサーバの更新日時を取得する。',
    tags: ['others'],
  })
  @Get('app-updated-at')
  async getCurrentServerUpdatedDate() {
    return {
      updated_at: moment(this.configProvider.config.appLastUpdateDatetime).toISOString(),
    }
  }
}
