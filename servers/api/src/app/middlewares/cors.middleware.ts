import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { ConfigProvider } from '@/app/providers/config.provider';
import { Coded } from '@/app/utils/coded';
import { CONSTANTS } from '@/config/constants';

/***
 * fastify-corsだけでは4xx系及び5xxのエラーでヘッダが追加されなかったので追加。
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware, Coded {
  private readonly logger = new Logger(CorsMiddleware.name);
  constructor(private readonly configProvider: ConfigProvider) {
    //
  }

  get code(): string {
    return 'MCR';
  }

  use(req, res, next: () => void) {
    // 今のところホストがどうなるか不明なので一旦全て許容する
    if (req.hostname) {
      res.setHeader('Access-Control-Allow-Origin', req.hostname);
    }
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', CONSTANTS.allowed_methods.join(', '));
    next();
  }
}
