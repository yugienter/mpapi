import { Logger } from '@nestjs/common';
import _ from 'lodash';

export class RequestUtil {
  private static readonly logger = new Logger(RequestUtil.name);

  static getApiVersion(request) {
    return Number(_.get(request?.headers, 'x-api-version', 1));
  }
}
