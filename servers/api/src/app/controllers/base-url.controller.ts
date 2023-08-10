import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { Coded } from '@/app/utils/coded';

/**
 * API以外（/api以外で受け渡す画面系資源）などを返す場合とかに用いるといいかもしれない。
 * なお、認証は通さない。
 * よほど特殊な理由がない限りは用いないこと。
 */
@Controller('')
export class BaseUrlController implements Coded {
  private readonly logger = new Logger(BaseUrlController.name);

  get code(): string {
    return 'CBS';
  }

  @ApiOperation({
    description: 'ヘルスチェック用',
  })
  @Get('')
  async getBase() {
    return {};
  }
}
